import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/admin_helper.dart';
import 'scorecard_screen.dart';

class LiveScoringInterface extends StatefulWidget {
  final String matchId;
  final Map<String, dynamic> matchData;

  const LiveScoringInterface({
    super.key,
    required this.matchId,
    required this.matchData,
  });

  @override
  State<LiveScoringInterface> createState() => _LiveScoringInterfaceState();
}

class _LiveScoringInterfaceState extends State<LiveScoringInterface> {
  bool isUpdating = false;
  List<String> thisOverBalls = [];
  List<Map<String, dynamic>> undoStack = [];
  int ballsBowledByCurrentBowler = 0;
  bool _initializedFromStream = false;

  int _parseOversToBalls(String oversStr) {
    if (oversStr.isEmpty || oversStr == '0.0') return 0;
    List<String> parts = oversStr.split('.');
    int overs = int.tryParse(parts[0]) ?? 0;
    int balls = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    return (overs * 6) + balls;
  }

  String _formatBallsToOvers(int totalBalls) {
    int overs = totalBalls ~/ 6;
    int balls = totalBalls % 6;
    return "$overs.$balls";
  }

  String _calculateRunRate(int runs, String oversStr) {
    int totalBalls = _parseOversToBalls(oversStr);
    if (totalBalls == 0) return "0.00";
    double oversDecimal = totalBalls / 6;
    double runRate = runs / oversDecimal;
    return runRate.toStringAsFixed(2);
  }

  double _calculateNRR(int runs, int wickets, String oversStr, int totalOversAllowed) {
    int totalBalls = _parseOversToBalls(oversStr);
    double oversFaced = totalBalls / 6;
    if (oversFaced == 0) return 0.0;
    return runs / oversFaced;
  }

  void _syncLocalStateFromFirestore(Map<String, dynamic> data) {
    if (_initializedFromStream) return;
    _initializedFromStream = true;

    final bowler = data['currentBowler'] as Map<String, dynamic>?;
    if (bowler != null) {
      String oversStr = bowler['overs']?.toString() ?? '0.0';
      int totalBalls = _parseOversToBalls(oversStr);
      ballsBowledByCurrentBowler = totalBalls % 6;
    }
    List<dynamic> recent = data['recentBalls'] ?? [];
    if (ballsBowledByCurrentBowler > 0 && recent.isNotEmpty) {
      int take = ballsBowledByCurrentBowler.clamp(0, recent.length);
      thisOverBalls = recent.sublist(recent.length - take).map((e) => e.toString()).toList();
    }
  }

  Future<void> _updateTournamentPoints(String winner, String loser,
      int winnerRuns, int winnerWickets, String winnerOvers,
      int loserRuns, int loserWickets, String loserOvers, int totalOvers) async {
    try {
      QuerySnapshot tournaments = await FirebaseFirestore.instance
          .collection('tournaments')
          .where('teams', arrayContains: winner)
          .get();

      for (var tournamentDoc in tournaments.docs) {
        Map<String, dynamic> tournamentData = tournamentDoc.data() as Map<String, dynamic>;
        List<dynamic> teams = tournamentData['teams'] ?? [];

        if (teams.contains(winner) && teams.contains(loser)) {
          Map<String, dynamic> pointsTable = tournamentData['pointsTable'] ?? {};

          double winnerNRR = _calculateNRR(winnerRuns, winnerWickets, winnerOvers, totalOvers);
          double loserNRR = _calculateNRR(loserRuns, loserWickets, loserOvers, totalOvers);

          if (pointsTable[winner] != null) {
            Map<String, dynamic> winnerStats = Map<String, dynamic>.from(pointsTable[winner]);
            winnerStats['played'] = (winnerStats['played'] ?? 0) + 1;
            winnerStats['won'] = (winnerStats['won'] ?? 0) + 1;
            winnerStats['points'] = (winnerStats['points'] ?? 0) + 2;
            winnerStats['nrr'] = ((winnerStats['nrr'] ?? 0.0) + winnerNRR).toDouble();
            pointsTable[winner] = winnerStats;
          }

          if (pointsTable[loser] != null) {
            Map<String, dynamic> loserStats = Map<String, dynamic>.from(pointsTable[loser]);
            loserStats['played'] = (loserStats['played'] ?? 0) + 1;
            loserStats['lost'] = (loserStats['lost'] ?? 0) + 1;
            loserStats['nrr'] = ((loserStats['nrr'] ?? 0.0) - loserNRR).toDouble();
            pointsTable[loser] = loserStats;
          }

          await FirebaseFirestore.instance.collection('tournaments').doc(tournamentDoc.id).update({
            'pointsTable': pointsTable,
            'completedMatches': FieldValue.increment(1),
          });

          break;
        }
      }
    } catch (e) {
      debugPrint("Error updating tournament points: $e");
    }
  }

  // ── DIALOGS & SELECTION ──────────────────────────────────────────

  Future<void> _showNewBatsmanDialog(String teamName) async {
    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection('players')
        .where('teamName', isEqualTo: teamName)
        .get();

    List<Map<String, dynamic>> players =
        snapshot.docs.map((doc) => doc.data() as Map<String, dynamic>).toList();

    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    List<dynamic> currentBatsmenData = data['currentBatsmen'] ?? [];
    List<String> currentNames = currentBatsmenData.map((b) => b['name'].toString()).toList();
    List<Map<String, dynamic>> availablePlayers =
        players.where((p) => !currentNames.contains(p['playerName'])).toList();

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: Text("Select Next Batsman ($teamName)"),
          content: SizedBox(
            width: double.maxFinite,
            child: availablePlayers.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text("No available players found for this team."),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: availablePlayers.length,
                    itemBuilder: (context, index) {
                      final name = availablePlayers[index]['playerName']?.toString() ?? 'Unknown';
                      return ListTile(
                        leading: CircleAvatar(child: Text(name.isNotEmpty ? name[0] : '?')),
                        title: Text(name),
                        subtitle: Text(availablePlayers[index]['role'] ?? ''),
                        onTap: () {
                          _selectNewBatsman(name);
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
          ),
        );
      },
    );
  }

  Future<void> _selectNewBatsman(String newName) async {
    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    List<dynamic> batsmenList = List.from(data['currentBatsmen'] ?? []);

    int outIndex = -1;
    for (int i = 0; i < batsmenList.length; i++) {
      if (batsmenList[i]['isOnStrike'] == true) {
        outIndex = i;
        break;
      }
    }

    if (outIndex != -1) {
      batsmenList[outIndex] = {
        'name': newName,
        'runs': 0,
        'balls': 0,
        'fours': 0,
        'sixes': 0,
        'isOnStrike': true,
      };
      await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
        'currentBatsmen': batsmenList,
      });
    }
  }

  Future<void> _showNewBowlerDialog(String teamName) async {
    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection('players')
        .where('teamName', isEqualTo: teamName)
        .get();

    List<Map<String, dynamic>> players =
        snapshot.docs.map((doc) => doc.data() as Map<String, dynamic>).toList();

    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    String currentBowlerName = (data['currentBowler'] as Map<String, dynamic>?)?['name'] ?? '';

    List<Map<String, dynamic>> availableBowlers =
        players.where((p) => p['playerName'] != currentBowlerName).toList();

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: Text("Select Next Bowler ($teamName)"),
          content: SizedBox(
            width: double.maxFinite,
            child: availableBowlers.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text("No available bowlers found for this team."),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: availableBowlers.length,
                    itemBuilder: (context, index) {
                      final name = availableBowlers[index]['playerName']?.toString() ?? 'Unknown';
                      return ListTile(
                        leading: CircleAvatar(child: Text(name.isNotEmpty ? name[0] : '?')),
                        title: Text(name),
                        subtitle: Text(availableBowlers[index]['role'] ?? ''),
                        onTap: () {
                          _selectNewBowler(name);
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
          ),
        );
      },
    );
  }

  Future<void> _selectNewBowler(String newName) async {
    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();

    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    Map<String, dynamic>? currentBowler = data['currentBowler'] as Map<String, dynamic>?;
    String currentBowlerName = currentBowler?['name'] ?? '';

    List<dynamic> bowlersHistory = List.from(data['bowlersHistory'] ?? []);
    if (currentBowler != null && currentBowlerName.isNotEmpty) {
      bool exists = bowlersHistory.any((b) => b['name'] == currentBowlerName);
      if (!exists) {
        bowlersHistory.add(currentBowler);
      } else {
        int index = bowlersHistory.indexWhere((b) => b['name'] == currentBowlerName);
        bowlersHistory[index] = currentBowler;
      }
    }

    Map<String, dynamic> newBowlerData;

    if (newName == currentBowlerName && currentBowler != null) {
      newBowlerData = {
        'name': newName,
        'overs': currentBowler['overs'] ?? '0.0',
        'runs': currentBowler['runs'] ?? 0,
        'wickets': currentBowler['wickets'] ?? 0,
        'maidens': currentBowler['maidens'] ?? 0,
      };
    } else {
      newBowlerData = {
        'name': newName,
        'overs': '0.0',
        'runs': 0,
        'wickets': 0,
        'maidens': 0,
      };
    }

    await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
      'currentBowler': newBowlerData,
      'bowlersHistory': bowlersHistory,
    });

    if (mounted) {
      setState(() {
        thisOverBalls.clear();
        ballsBowledByCurrentBowler = 0;
      });
    }
  }

  Future<void> _showSelectTwoBatsmenDialog(String teamName) async {
    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection('players')
        .where('teamName', isEqualTo: teamName)
        .get();

    List<Map<String, dynamic>> players =
        snapshot.docs.map((doc) => doc.data() as Map<String, dynamic>).toList();
    List<String> selectedBatsmen = [];

    if (!mounted) return;
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text("Select 2 Opening Batsmen ($teamName)"),
              content: SizedBox(
                width: double.maxFinite,
                child: players.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(20),
                        child: Text("No players found for this team."),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: players.length,
                        itemBuilder: (context, index) {
                          String playerName = players[index]['playerName'] ?? 'Unknown';
                          bool isSelected = selectedBatsmen.contains(playerName);

                          return CheckboxListTile(
                            title: Text(playerName),
                            subtitle: Text(players[index]['role'] ?? ''),
                            value: isSelected,
                            onChanged: (val) {
                              setDialogState(() {
                                if (val == true) {
                                  if (selectedBatsmen.length < 2) {
                                    selectedBatsmen.add(playerName);
                                  }
                                } else {
                                  selectedBatsmen.remove(playerName);
                                }
                              });
                            },
                          );
                        },
                      ),
              ),
              actions: [
                ElevatedButton(
                  onPressed: selectedBatsmen.length == 2
                      ? () async {
                          Navigator.pop(context);
                          List<Map<String, dynamic>> newBatsmen = selectedBatsmen.map((name) {
                            return {
                              'name': name,
                              'runs': 0,
                              'balls': 0,
                              'fours': 0,
                              'sixes': 0,
                              'isOnStrike': name == selectedBatsmen.first,
                            };
                          }).toList();

                          await FirebaseFirestore.instance
                              .collection('matches')
                              .doc(widget.matchId)
                              .update({'currentBatsmen': newBatsmen});
                        }
                      : null,
                  child: const Text("Confirm"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showInningsBreakDialog(
      String battingTeam, String score, String bowlingTeam, int target) async {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text("Innings Break!"),
          content: Text("$battingTeam scored $score.\n\n$bowlingTeam needs $target runs to win."),
          actions: [
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                await _startSecondInnings(battingTeam, bowlingTeam, target);
              },
              child: const Text("Start 2nd Innings"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _startSecondInnings(
      String oldBattingTeam, String newBattingTeam, int target) async {
    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> currentData = doc.data() as Map<String, dynamic>;
    String firstInningsScore = currentData['team1Score'] ?? '0/0';

    await _showSelectTwoBatsmenDialog(newBattingTeam);
    await Future.delayed(const Duration(milliseconds: 300));
    await _showNewBowlerDialog(oldBattingTeam);

    await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
      'team1': newBattingTeam,
      'team2': oldBattingTeam,
      'firstInningsTeam': oldBattingTeam,
      'firstInningsScore': firstInningsScore,
      'team1Score': '0/0',
      'team1Overs': '0.0',
      'team1Runs': 0,
      'team1Wickets': 0,
      'target': target,
      'status': 'live',
      'recentBalls': [],
      'bowlersHistory': [],
      'inningsNumber': 2,
    });

    if (mounted) {
      setState(() {
        thisOverBalls.clear();
        ballsBowledByCurrentBowler = 0;
      });
    }
  }

  Future<void> _showMatchWonDialog(
      String winningTeam, String losingTeam, int wickets, int target) async {
    int wicketsRemaining = 10 - wickets;

    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    String firstInningsScore = data['firstInningsScore'] ?? '0/0';
    int totalOvers = data['totalOvers'] ?? 20;
    String currentOvers = data['team1Overs'] ?? '0.0';

    List<String> firstParts = firstInningsScore.split('/');
    int firstRuns = int.tryParse(firstParts[0]) ?? 0;
    int firstWickets = int.tryParse(firstParts.length > 1 ? firstParts[1] : '0') ?? 0;

    List<String> currentParts = (data['team1Score'] ?? '0/0').split('/');
    int currentRuns = int.tryParse(currentParts[0]) ?? 0;
    int currentWickets = int.tryParse(currentParts.length > 1 ? currentParts[1] : '0') ?? 0;

    int winnerRuns = currentRuns;
    int winnerWickets = currentWickets;
    String winnerOvers = currentOvers;
    int loserRuns = firstRuns;
    int loserWickets = firstWickets;
    String loserOvers = "$totalOvers.0";

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text("Match Won!", style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.emoji_events, size: 60, color: Colors.amber),
              const SizedBox(height: 15),
              Text(
                "$winningTeam won by $wicketsRemaining wickets!",
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text("Target: $target runs", style: TextStyle(color: Colors.grey.shade600)),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                await _updateTournamentPoints(
                  winningTeam, losingTeam,
                  winnerRuns, winnerWickets, winnerOvers,
                  loserRuns, loserWickets, loserOvers, totalOvers,
                );

                await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
                  'status': 'completed',
                  'winner': winningTeam,
                  'result': '$winningTeam won by $wicketsRemaining wickets',
                  // team1/team2 get swapped when the 2nd innings starts, and
                  // only team1Score is kept live from that point on — so the
                  // team that batted first (now stored as team2) never gets
                  // its final score written back without this.
                  'team2Score': firstInningsScore,
                  'team2Overs': "$totalOvers.0",
                });

                if (mounted) {
                  Navigator.pop(context);
                }
              },
              child: const Text("OK"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _showMatchResultDialog(
      String battingTeam, String bowlingTeam, int finalScore, int target) async {
    int runsShort = target - finalScore;

    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    String firstInningsScore = data['firstInningsScore'] ?? '0/0';
    int totalOvers = data['totalOvers'] ?? 20;
    String currentOvers = data['team1Overs'] ?? '0.0';

    List<String> firstParts = firstInningsScore.split('/');
    int firstRuns = int.tryParse(firstParts[0]) ?? 0;
    int firstWickets = int.tryParse(firstParts.length > 1 ? firstParts[1] : '0') ?? 0;

    List<String> currentParts = (data['team1Score'] ?? '0/0').split('/');
    int currentRuns = int.tryParse(currentParts[0]) ?? 0;
    int currentWickets = int.tryParse(currentParts.length > 1 ? currentParts[1] : '0') ?? 0;

    bool isTie = finalScore == target - 1;
    String winner = isTie ? 'Tied' : bowlingTeam;
    String loser = isTie ? '' : battingTeam;
    int winnerRuns = firstRuns;
    int winnerWickets = firstWickets;
    String winnerOvers = "$totalOvers.0";
    int loserRuns = currentRuns;
    int loserWickets = currentWickets;
    String loserOvers = currentOvers;

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text("Match Over", style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isTie) ...[
                const Icon(Icons.handshake, size: 60, color: Colors.blue),
                const SizedBox(height: 15),
                const Text("Match Tied!", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ] else ...[
                const Icon(Icons.emoji_events, size: 60, color: Colors.amber),
                const SizedBox(height: 15),
                Text(
                  "$bowlingTeam won by $runsShort runs!",
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);

                if (!isTie) {
                  await _updateTournamentPoints(
                    winner, loser,
                    winnerRuns, winnerWickets, winnerOvers,
                    loserRuns, loserWickets, loserOvers, totalOvers,
                  );
                }

                String result = isTie ? 'Match Tied' : '$bowlingTeam won by $runsShort runs';

                await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
                  'status': 'completed',
                  'winner': isTie ? 'Tied' : bowlingTeam,
                  'result': result,
                  // Same backfill as the chase-completion path — team2 here
                  // is the team that batted first (pre-innings-swap), whose
                  // final score is frozen in firstInningsScore.
                  'team2Score': firstInningsScore,
                  'team2Overs': "$totalOvers.0",
                });

                if (mounted) {
                  Navigator.pop(context);
                }
              },
              child: const Text("OK"),
            ),
          ],
        );
      },
    );
  }

  /// ✅ THE MAIN FIX IN THIS VERSION.
  ///
  /// _addBall() deliberately SKIPS writing 'team1Overs' on the ball that
  /// completes an over — it expects THIS function to advance the over
  /// count to the next whole number afterward (e.g. 0.5 -> 1.0). That
  /// write was completely missing before, so after every completed over
  /// the displayed overs count stayed frozen at "X.5" forever — exactly
  /// the "0.5 instead of 1.x" bug seen in the screenshot.
  Future<void> _handleOverCompletion(String bowlingTeamName) async {
    if (ballsBowledByCurrentBowler != 6) return;

    await Future.delayed(const Duration(milliseconds: 300));

    DocumentSnapshot doc =
        await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

    List<dynamic> batsmenList = List.from(data['currentBatsmen'] ?? []);
    for (int i = 0; i < batsmenList.length; i++) {
      Map<String, dynamic> bat = Map<String, dynamic>.from(batsmenList[i]);
      bat['isOnStrike'] = !bat['isOnStrike'];
      batsmenList[i] = bat;
    }

    // Read whatever overs value is currently stored (the value from
    // BEFORE the completing ball, e.g. "0.5"), then round up to the next
    // whole over: floor(5/6) + 1 = 1 -> "1.0".
    String currentOversStr = data['team1Overs']?.toString() ?? '0.0';
    int totalBallsSoFar = _parseOversToBalls(currentOversStr);
    int completedOvers = (totalBallsSoFar ~/ 6) + 1;
    String newOversStr = "$completedOvers.0";

    await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
      'currentBatsmen': batsmenList,
      'team1Overs': newOversStr,
    });

    if (mounted) {
      setState(() {
        thisOverBalls.clear();
        ballsBowledByCurrentBowler = 0;
      });
      await _showNewBowlerDialog(bowlingTeamName);
    }
  }

  Future<void> _addBall(String ballType) async {
    if (isUpdating) return;
    setState(() => isUpdating = true);

    try {
      DocumentSnapshot doc =
          await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).get();
      Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

      undoStack.add({
        'team1Score': data['team1Score'],
        'team1Overs': data['team1Overs'],
        'team1Runs': data['team1Runs'],
        'team1Wickets': data['team1Wickets'],
        'currentBatsmen': List.from(data['currentBatsmen'] ?? []),
        'currentBowler': Map<String, dynamic>.from(data['currentBowler'] ?? {}),
        'bowlersHistory': List.from(data['bowlersHistory'] ?? []),
        'recentBalls': List.from(data['recentBalls'] ?? []),
        'thisOverBalls': List<String>.from(thisOverBalls),
        'ballsBowledByCurrentBowler': ballsBowledByCurrentBowler,
      });

      String team1ScoreStr = data['team1Score'] ?? '0/0';
      List<String> t1Parts = team1ScoreStr.split('/');
      int t1Runs = int.tryParse(t1Parts[0]) ?? (data['team1Runs'] ?? 0);
      int t1Wickets = int.tryParse(t1Parts.length > 1 ? t1Parts[1] : '0') ?? (data['team1Wickets'] ?? 0);
      String t1OversStr = data['team1Overs'] ?? '0.0';

      List<dynamic> batsmenList = List.from(data['currentBatsmen'] ?? []);
      Map<String, dynamic>? bowlerData =
          data['currentBowler'] != null ? Map<String, dynamic>.from(data['currentBowler']) : null;
      List<dynamic> recentBalls = List.from(data['recentBalls'] ?? []);

      int totalBalls = _parseOversToBalls(t1OversStr);
      int runsToAdd = 0;
      bool isLegalBall = true;
      bool isPersonalRun = true;
      String ballDisplay = ballType;

      int strikerIndex = -1;
      for (int i = 0; i < batsmenList.length; i++) {
        if (batsmenList[i]['isOnStrike'] == true) {
          strikerIndex = i;
          break;
        }
      }

      switch (ballType) {
        case '0':
          runsToAdd = 0;
          break;
        case '1':
          runsToAdd = 1;
          break;
        case '2':
          runsToAdd = 2;
          break;
        case '3':
          runsToAdd = 3;
          break;
        case '4':
          runsToAdd = 4;
          break;
        case '6':
          runsToAdd = 6;
          break;
        case 'W':
          runsToAdd = 0;
          t1Wickets++;
          ballDisplay = 'W';
          break;
        case 'WD':
          runsToAdd = 1;
          isLegalBall = false;
          isPersonalRun = false;
          ballDisplay = 'WD';
          break;
        case 'NB':
          runsToAdd = 1;
          isLegalBall = false;
          isPersonalRun = false;
          ballDisplay = 'NB';
          break;
        case 'BYE':
          runsToAdd = 1;
          isLegalBall = true;
          isPersonalRun = false;
          ballDisplay = 'B';
          break;
        case 'LB':
          runsToAdd = 1;
          isLegalBall = true;
          isPersonalRun = false;
          ballDisplay = 'LB';
          break;
      }

      t1Runs += runsToAdd;

      if (isLegalBall) {
        totalBalls++;
        ballsBowledByCurrentBowler++;
      }

      if (strikerIndex >= 0 && isLegalBall) {
        Map<String, dynamic> striker = Map<String, dynamic>.from(batsmenList[strikerIndex]);
        striker['balls'] = (striker['balls'] ?? 0) + 1;
        if (isPersonalRun) {
          striker['runs'] = (striker['runs'] ?? 0) + runsToAdd;
          if (runsToAdd == 4) striker['fours'] = (striker['fours'] ?? 0) + 1;
          if (runsToAdd == 6) striker['sixes'] = (striker['sixes'] ?? 0) + 1;
        }
        batsmenList[strikerIndex] = striker;
      }

      if (bowlerData != null) {
        if (ballType == 'WD' || ballType == 'NB') {
          // Wides and no-balls count against the bowler's runs conceded,
          // but don't count as a ball bowled (over doesn't advance).
          bowlerData['runs'] = (bowlerData['runs'] ?? 0) + runsToAdd;
        } else if (ballType == 'BYE' || ballType == 'LB') {
          // Byes/leg-byes count as a ball bowled, but the runs are the
          // batting side's, not conceded by the bowler.
          String bowlerOversStr = bowlerData['overs']?.toString() ?? '0.0';
          int bowlerBalls = _parseOversToBalls(bowlerOversStr);
          bowlerBalls++;
          bowlerData['overs'] = _formatBallsToOvers(bowlerBalls);
        } else {
          // Normal delivery: dot ball, runs off the bat, or a wicket —
          // counts as a ball bowled AND the runs count against the bowler.
          String bowlerOversStr = bowlerData['overs']?.toString() ?? '0.0';
          int bowlerBalls = _parseOversToBalls(bowlerOversStr);
          bowlerBalls++;
          bowlerData['overs'] = _formatBallsToOvers(bowlerBalls);
          bowlerData['runs'] = (bowlerData['runs'] ?? 0) + runsToAdd;
          if (ballType == 'W') bowlerData['wickets'] = (bowlerData['wickets'] ?? 0) + 1;
        }
      }

      String newOvers = _formatBallsToOvers(totalBalls);
      String newScoreStr = "$t1Runs/$t1Wickets";

      recentBalls.add(ballDisplay);
      thisOverBalls.add(ballDisplay);

      if (ballType != 'W' && isPersonalRun && runsToAdd % 2 != 0) {
        for (int i = 0; i < batsmenList.length; i++) {
          Map<String, dynamic> bat = Map<String, dynamic>.from(batsmenList[i]);
          bat['isOnStrike'] = !bat['isOnStrike'];
          batsmenList[i] = bat;
        }
      }

      int totalOvers = data['totalOvers'] ?? 20;
      int maxBalls = totalOvers * 6;
      int target = data['target'] ?? 0;
      int currentInnings = data['inningsNumber'] ?? 1;

      bool targetReached = (currentInnings == 2 && target > 0 && t1Runs >= target);
      bool isInningsOver = totalBalls >= maxBalls || t1Wickets >= 10 || targetReached;
      bool isOverComplete = (isLegalBall && ballsBowledByCurrentBowler == 6 && !isInningsOver);

      List<dynamic> bowlersHistory = List.from(data['bowlersHistory'] ?? []);
      if (bowlerData != null) {
        String bowlerName = bowlerData['name'] ?? '';
        bool exists = bowlersHistory.any((b) => b['name'] == bowlerName);
        if (!exists) {
          bowlersHistory.add(bowlerData);
        } else {
          int index = bowlersHistory.indexWhere((b) => b['name'] == bowlerName);
          bowlersHistory[index] = bowlerData;
        }
      }

      // If the innings ends ON the 6th ball of an over, write the full
      // over count directly here, since isOverComplete is forced false
      // above (it excludes isInningsOver) and _handleOverCompletion()
      // — which normally performs this bump — never gets called then.
      String oversToWrite;
      if (isInningsOver && ballsBowledByCurrentBowler == 6 && isLegalBall) {
        oversToWrite = "${totalBalls ~/ 6}.0";
      } else {
        oversToWrite = newOvers;
      }

      Map<String, dynamic> updatePayload = {
        'team1Runs': t1Runs,
        'team1Wickets': t1Wickets,
        // Only the over-completing ball (when innings continues) skips
        // writing overs here — _handleOverCompletion() writes it instead.
        // Every other ball, including innings-ending balls, writes it
        // directly so the over count is never left stale.
        if (!isOverComplete) 'team1Overs': oversToWrite,
        'team1Score': newScoreStr,
        'currentBatsmen': batsmenList,
        'currentBowler': bowlerData,
        'bowlersHistory': bowlersHistory,
        'recentBalls': recentBalls,
      };
      if (isInningsOver && currentInnings == 1 && !targetReached) {
        updatePayload['status'] = 'innings_break';
      }

      await FirebaseFirestore.instance
          .collection('matches')
          .doc(widget.matchId)
          .update(updatePayload);

      setState(() => isUpdating = false);

      if (isOverComplete) {
        await _handleOverCompletion(data['team2'] ?? 'Team 2');
      }

      if (isInningsOver) {
        String battingTeam = data['team1'] ?? 'Team 1';
        String bowlingTeam = data['team2'] ?? 'Team 2';

        if (targetReached) {
          await _showMatchWonDialog(battingTeam, bowlingTeam, t1Wickets, target);
        } else if (currentInnings == 1) {
          int newTarget = t1Runs + 1;
          await _showInningsBreakDialog(battingTeam, newScoreStr, bowlingTeam, newTarget);
        } else {
          await _showMatchResultDialog(battingTeam, bowlingTeam, t1Runs, target);
        }
      } else if (ballType == 'W') {
        await _showNewBatsmanDialog(data['team1'] ?? 'Team 1');
      }
    } catch (e) {
      debugPrint("Error in _addBall: $e");
      if (mounted) {
        setState(() => isUpdating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error updating score: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _undoLastBall() async {
    if (undoStack.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Nothing to undo"), backgroundColor: Colors.orange),
      );
      return;
    }

    Map<String, dynamic> lastState = undoStack.removeLast();

    await FirebaseFirestore.instance.collection('matches').doc(widget.matchId).update({
      'team1Score': lastState['team1Score'],
      'team1Overs': lastState['team1Overs'],
      'team1Runs': lastState['team1Runs'],
      'team1Wickets': lastState['team1Wickets'],
      'currentBatsmen': lastState['currentBatsmen'],
      'currentBowler': lastState['currentBowler'],
      'bowlersHistory': lastState['bowlersHistory'],
      'recentBalls': lastState['recentBalls'],
    });

    if (mounted) {
      setState(() {
        thisOverBalls = List<String>.from(lastState['thisOverBalls'] ?? []);
        ballsBowledByCurrentBowler = lastState['ballsBowledByCurrentBowler'] ?? 0;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Last ball undone"), backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isAdmin = AdminHelper.isAdmin();

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('matches').doc(widget.matchId).snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (!snapshot.data!.exists) {
          return const Scaffold(body: Center(child: Text("Match not found")));
        }

        final matchData = snapshot.data!.data() as Map<String, dynamic>;
        _syncLocalStateFromFirestore(matchData);

        String team1 = matchData['team1'] ?? 'Team 1';
        String team2 = matchData['team2'] ?? 'Team 2';
        String score = matchData['team1Score'] ?? '0/0';
        String overs = matchData['team1Overs'] ?? '0.0';
        int t1Runs = matchData['team1Runs'] ?? 0;
        int target = matchData['target'] ?? 0;
        int innings = matchData['inningsNumber'] ?? 1;
        String status = matchData['status'] ?? 'live';

        if (status == 'completed') {
          return Scaffold(
            backgroundColor: const Color(0xFFF7F7F5),
            appBar: AppBar(              elevation: 0,
              title: const Text("Match completed", style: TextStyle(fontWeight: FontWeight.w500)),
            ),
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.emoji_events_outlined, size: 56, color: Color(0xFFBA7517)),
                  const SizedBox(height: 16),
                  Text(
                    matchData['result']?.toString() ?? 'Match completed',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ScorecardScreen(
                            matchId: widget.matchId,
                            matchData: matchData,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.menu_book_outlined, size: 18),
                    label: const Text("View full scorecard"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F3D3E),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        List<dynamic> batsmen = matchData['currentBatsmen'] ?? [];
        Map<String, dynamic>? bowler = matchData['currentBowler'] as Map<String, dynamic>?;

        Map<String, dynamic>? striker;
        Map<String, dynamic>? nonStriker;
        for (var bat in batsmen) {
          if (bat['isOnStrike'] == true) {
            striker = bat as Map<String, dynamic>;
          } else {
            nonStriker = bat as Map<String, dynamic>;
          }
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF7F7F5),
          appBar: AppBar(            elevation: 0,
            title: Text("Innings $innings", style: const TextStyle(fontWeight: FontWeight.w500)),
            actions: [
              IconButton(
                icon: const Icon(Icons.menu_book_outlined),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ScorecardScreen(matchId: widget.matchId, matchData: matchData),
                    ),
                  );
                },
              ),
            ],
          ),
          body: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF0F3D3E), Color(0xFF1a5f5f)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(team1.toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 4),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(score.contains('/') ? score.split('/')[0] : score,
                                style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w500)),
                            Text("/${score.contains('/') ? score.split('/')[1] : '0'}",
                                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w500)),
                          ],
                        ),
                        Text("($overs ov)  CRR ${_calculateRunRate(t1Runs, overs)}",
                            style: const TextStyle(color: Color(0xFF9FE1CB), fontSize: 12)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: const Color(0xFFE53935), borderRadius: BorderRadius.circular(10)),
                          child: const Text("● LIVE",
                              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500)),
                        ),
                        const SizedBox(height: 6),
                        Text(team2.toUpperCase(),
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 11)),
                        Text(innings == 1 ? "Yet to bat" : "Target $target",
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                color: Colors.white,
                child: Row(
                  children: [
                    Expanded(child: _buildBatsmanCard(striker, isOnStrike: true)),
                    const SizedBox(width: 10),
                    Expanded(child: _buildBatsmanCard(nonStriker, isOnStrike: false)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                color: Colors.white,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.sports_baseball_outlined, color: const Color(0xFF78909C), size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(bowler?['name']?.toString() ?? 'No bowler',
                                style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
                        Text(
                          "${bowler?['overs'] ?? '0.0'}-${bowler?['maidens'] ?? 0}-${bowler?['runs'] ?? 0}-${bowler?['wickets'] ?? 0}",
                          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 13, color: const Color(0xFF78909C)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Text("This over", style: TextStyle(fontSize: 11, color: const Color(0xFF78909C))),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Wrap(
                            spacing: 6,
                            children: thisOverBalls.map((ball) {
                              return Container(
                                width: 26,
                                height: 26,
                                decoration: BoxDecoration(color: _getBallColor(ball), shape: BoxShape.circle),
                                alignment: Alignment.center,
                                child: Text(ball,
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500,
                                        fontSize: 11)),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (isAdmin)
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.white,
                  child: Column(
                    children: [
                      Row(children: [
                        Expanded(child: _buildScoreButton('0', const Color(0xFFF5F5F5), const Color(0xFF1a1a1a))),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('1', const Color(0xFFF5F5F5), const Color(0xFF1a1a1a))),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('2', const Color(0xFFF5F5F5), const Color(0xFF1a1a1a))),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('3', const Color(0xFFF5F5F5), const Color(0xFF1a1a1a))),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('4', const Color(0xFF00A550), Colors.white)),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('6', const Color(0xFF6a1b9a), Colors.white)),
                      ]),
                      const SizedBox(height: 8),
                      Row(children: [
                        Expanded(child: _buildScoreButton('WD', const Color(0xFFFF9800), Colors.white)),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('NB', const Color(0xFFFF9800), Colors.white)),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('BYE', const Color(0xFFFF9800), Colors.white)),
                        const SizedBox(width: 6),
                        Expanded(child: _buildScoreButton('LB', const Color(0xFFFF9800), Colors.white)),
                      ]),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _undoLastBall,
                            icon: const Icon(Icons.undo, size: 16),
                            label: const Text("UNDO", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
                            style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF1a1a1a),
                                side: BorderSide(color: const Color(0xFFF5F5F5)),
                                padding: const EdgeInsets.symmetric(vertical: 10)),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: isUpdating ? null : () => _addBall('W'),
                            icon: const Icon(Icons.close, size: 16),
                            label: const Text("WICKET", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                            style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE53935),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 10)),
                          ),
                        ),
                      ]),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(20),
                  color: const Color(0xFFE8F5E9),
                  child: Column(
                    children: [
                      Icon(Icons.visibility_outlined, size: 36, color: const Color(0xFF00A550)),
                      const SizedBox(height: 8),
                      const Text("Live score view",
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: Color(0xFF085041))),
                      const Text("Admin controls are hidden", style: TextStyle(color: const Color(0xFF78909C), fontSize: 12)),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  // ── Maps a ball's display string to a chip color ─────────────────
  Color _getBallColor(String ball) {
    switch (ball) {
      case 'W':
        return Colors.red.shade600;
      case '4':
        return Colors.blue.shade600;
      case '6':
        return Colors.purple.shade600;
      case 'WD':
      case 'NB':
      case 'B':
      case 'LB':
        return Colors.orange.shade600;
      case '0':
        return Colors.grey.shade500;
      default:
        return Colors.green.shade600;
    }
  }

  Widget _buildBatsmanCard(Map<String, dynamic>? batsman, {required bool isOnStrike}) {
    if (batsman == null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(8)),
        child: const Text("No batsman", style: TextStyle(color: const Color(0xFF78909C), fontSize: 12)),
      );
    }
    String name = batsman['name']?.toString() ?? 'Unknown';
    int runs = batsman['runs'] ?? 0;
    int balls = batsman['balls'] ?? 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isOnStrike ? const Color(0xFFE8F5E9) : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(8),
        border: isOnStrike ? Border.all(color: const Color(0xFF00A550), width: 1.5) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Flexible(
                child: Text(
                  name,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isOnStrike ? const Color(0xFF085041) : const Color(0xFF78909C),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isOnStrike)
                const Padding(
                  padding: EdgeInsets.only(left: 3),
                  child: Text("●", style: TextStyle(color: Color(0xFF1D9E75), fontSize: 8)),
                ),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text("$runs", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w500)),
              Text(" ($balls)", style: TextStyle(fontSize: 11, color: const Color(0xFF78909C))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScoreButton(String label, Color color, Color textColor) {
    return GestureDetector(
      onTap: isUpdating ? null : () => _addBall(label),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: textColor)),
        ),
      ),
    );
  }
}
