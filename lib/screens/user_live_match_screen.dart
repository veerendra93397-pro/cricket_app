import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class UserLiveMatchScreen extends StatefulWidget {
  final String matchId;
  final Map<String, dynamic> matchData;

  const UserLiveMatchScreen({
    super.key,
    required this.matchId,
    required this.matchData,
  });

  @override
  State<UserLiveMatchScreen> createState() => _UserLiveMatchScreenState();
}

class _UserLiveMatchScreenState extends State<UserLiveMatchScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  int _parseOversToBalls(String oversStr) {
    if (oversStr.isEmpty || oversStr == '0.0') return 0;
    List<String> parts = oversStr.split('.');
    int overs = int.tryParse(parts[0]) ?? 0;
    int balls = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    return (overs * 6) + balls;
  }

  String _calculateRunRate(int runs, String oversStr) {
    int totalBalls = _parseOversToBalls(oversStr);
    if (totalBalls == 0) return "0.00";
    double oversDecimal = totalBalls / 6;
    double runRate = runs / oversDecimal;
    return runRate.toStringAsFixed(2);
  }

  String _calculateRequiredRate(int runs, String oversStr, int target, int totalOvers) {
    int totalBalls = _parseOversToBalls(oversStr);
    int remainingBalls = (totalOvers * 6) - totalBalls;
    if (remainingBalls <= 0) return "0.00";
    int runsNeeded = target - runs;
    if (runsNeeded <= 0) return "0.00";
    double oversDecimal = remainingBalls / 6;
    double reqRate = runsNeeded / oversDecimal;
    return reqRate.toStringAsFixed(2);
  }

  String _calculateBowlerEconomy(Map<String, dynamic> bowler) {
    String oversStr = bowler['overs']?.toString() ?? '0.0';
    int runs = bowler['runs'] ?? 0;
    List<String> parts = oversStr.split('.');
    int overs = int.tryParse(parts[0]) ?? 0;
    int balls = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    int totalBalls = (overs * 6) + balls;
    if (totalBalls == 0) return "0.00";
    double oversDecimal = totalBalls / 6;
    double economy = runs / oversDecimal;
    return economy.toStringAsFixed(2);
  }

  String _formatDate(dynamic dateValue) {
    if (dateValue == null) return 'TBD';
    if (dateValue is Timestamp) {
      final date = dateValue.toDate();
      return "${date.day}/${date.month}/${date.year}";
    }
    return dateValue.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F8F8),
      appBar: AppBar(        elevation: 0,
        title: const Text("BTG CRICKET", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFF00A550),
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: "INFO"),
            Tab(text: "LIVE"),
            Tab(text: "SCORECARD"),
            Tab(text: "SQUADS"),
            Tab(text: "POINTS"),
          ],
        ),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('matches')
            .doc(widget.matchId)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data!.data() as Map<String, dynamic>;
          String team1 = data['team1'] ?? 'Team 1';
          String team2 = data['team2'] ?? 'Team 2';
          String score = data['team1Score'] ?? '0/0';
          String overs = data['team1Overs'] ?? '0.0';
          int t1Runs = data['team1Runs'] ?? 0;
          int t1Wickets = data['team1Wickets'] ?? 0;
          int totalOvers = data['totalOvers'] ?? 20;
          int target = data['target'] ?? 0;
          int innings = data['inningsNumber'] ?? 1;
          String status = data['status'] ?? 'upcoming';
          String venue = data['venue'] ?? 'TBD';
          String tossWinner = data['tossWinner'] ?? '';
          String tossDecision = data['tossDecision'] ?? '';

          List<dynamic> batsmen = data['currentBatsmen'] ?? [];
          Map<String, dynamic>? bowler = data['currentBowler'] as Map<String, dynamic>?;
          List<dynamic> recentBalls = data['recentBalls'] ?? [];
          List<dynamic> bowlersHistory = data['bowlersHistory'] ?? [];

          int runsNeeded = target > 0 ? target - t1Runs : 0;
          String crr = _calculateRunRate(t1Runs, overs);
          String reqRate = target > 0 ? _calculateRequiredRate(t1Runs, overs, target, totalOvers) : "0.00";

          String tournamentId = data['tournamentId'] ?? '';

          return TabBarView(
            controller: _tabController,
            children: [
              _buildInfoTab(data, venue, tossWinner, tossDecision, totalOvers, team1, team2),
              _buildLiveTab(data, team1, team2, score, overs, t1Runs, t1Wickets, totalOvers, target, innings, status, batsmen, bowler, recentBalls, crr, reqRate, runsNeeded),
              _buildScorecardTab(data, team1, team2, score, overs, totalOvers, batsmen, bowler, bowlersHistory, recentBalls),
              _buildSquadsTab(team1, team2),
              tournamentId.isNotEmpty ? _buildPointsTableTab(tournamentId) : _buildNoPointsTab(),
            ],
          );
        },
      ),
    );
  }

  // ==================== INFO TAB ====================
  Widget _buildInfoTab(Map<String, dynamic> data, String venue, String tossWinner, String tossDecision, int totalOvers, String team1, String team2) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFF0F3D3E),
            ),
            child: Column(
              children: [
                const Text("BTG CRICKET LEAGUE 2026", style: TextStyle(color: Colors.white70, fontSize: 11, letterSpacing: 1)),
                const SizedBox(height: 10),
                Text("$team1 vs $team2", style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 5),
                Text(_formatDate(data['matchDate']), style: const TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00A550),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text("LIVE", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("MATCH DETAILS", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F3D3E))),
                      const SizedBox(height: 15),
                      _buildInfoRow(Icons.location_on, "Venue", venue),
                      const Divider(height: 20),
                      _buildInfoRow(Icons.sports_cricket, "Toss", "$tossWinner won the toss and elected to $tossDecision"),
                      const Divider(height: 20),
                      _buildInfoRow(Icons.timer, "Format", "T$totalOvers"),
                      const Divider(height: 20),
                      _buildInfoRow(Icons.flag, "Umpires", "A. Kumar, B. Singh"),
                      const Divider(height: 20),
                      _buildInfoRow(Icons.person, "Match Referee", "C. Sharma"),
                    ],
                  ),
                ),
                const SizedBox(height: 15),

                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("TEAMS", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F3D3E))),
                      const SizedBox(height: 15),
                      _buildTeamRow(team1, Colors.blue),
                      const SizedBox(height: 10),
                      _buildTeamRow(team2, Colors.red),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF0F3D3E)),
        const SizedBox(width: 10),
        SizedBox(width: 90, child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, color: Colors.black87))),
      ],
    );
  }

  Widget _buildTeamRow(String teamName, MaterialColor color) {
    return Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: color.shade100,
          child: Text(teamName.isNotEmpty ? teamName[0].toUpperCase() : 'T', style: TextStyle(color: color.shade800, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(teamName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
      ],
    );
  }

  // ==================== LIVE TAB ====================
  Widget _buildLiveTab(Map<String, dynamic> data, String team1, String team2, String score, String overs, int t1Runs, int t1Wickets, int totalOvers, int target, int innings, String status, List<dynamic> batsmen, Map<String, dynamic>? bowler, List<dynamic> recentBalls, String crr, String reqRate, int runsNeeded) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(15),
            decoration: const BoxDecoration(color: Color(0xFF0F3D3E)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (innings == 2 && target > 0)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 5),
                    child: Text("$team2: $target", style: const TextStyle(color: Colors.white54, fontSize: 12)),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Text("${team1.toUpperCase()} ", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text(score, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text(" ($overs)", style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ),
                    if (status == 'live')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(3)),
                        child: const Text("LIVE", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text("CRR: $crr", style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(width: 15),
                    if (target > 0) ...[
                      Text("REQ: $reqRate", style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(width: 15),
                      Text("Need $runsNeeded off ${((totalOvers * 6) - _parseOversToBalls(overs))} balls", style: const TextStyle(color: Color(0xFF00A550), fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ],
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Expanded(flex: 3, child: Text("BATTER", style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                            Expanded(child: Text("R", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                            Expanded(child: Text("B", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                            Expanded(child: Text("4s", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                            Expanded(child: Text("6s", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                            Expanded(child: Text("SR", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      ...batsmen.map((bat) {
                        final b = bat as Map<String, dynamic>;
                        bool isOnStrike = b['isOnStrike'] == true;
                        int runs = b['runs'] ?? 0;
                        int balls = b['balls'] ?? 0;
                        int fours = b['fours'] ?? 0;
                        int sixes = b['sixes'] ?? 0;
                        String sr = balls > 0 ? ((runs / balls) * 100).toStringAsFixed(2) : "0.00";
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
                            color: isOnStrike ? Colors.grey.shade50 : Colors.white,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 3,
                                child: Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        b['name']?.toString() ?? 'Unknown',
                                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isOnStrike) const Text(" *", style: TextStyle(color: Color(0xFF00A550), fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                              Expanded(child: Text("$runs", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold))),
                              Expanded(child: Text("$balls", textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
                              Expanded(child: Text("$fours", textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
                              Expanded(child: Text("$sixes", textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
                              Expanded(child: Text(sr, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12))),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 15),

                if (bowler != null) ...[
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              const Expanded(flex: 3, child: Text("BOWLER", style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                              Expanded(child: Text("O", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                              Expanded(child: Text("M", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                              Expanded(child: Text("R", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                              Expanded(child: Text("W", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                              Expanded(child: Text("ECO", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ),
                        const Divider(height: 1),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 3,
                                child: Text(bowler['name']?.toString() ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                              ),
                              Expanded(child: Text("${bowler['overs'] ?? '0.0'}", textAlign: TextAlign.center)),
                              Expanded(child: Text("${bowler['maidens'] ?? 0}", textAlign: TextAlign.center)),
                              Expanded(child: Text("${bowler['runs'] ?? 0}", textAlign: TextAlign.center)),
                              Expanded(child: Text("${bowler['wickets'] ?? 0}", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold))),
                              Expanded(child: Text(_calculateBowlerEconomy(bowler), textAlign: TextAlign.center, style: const TextStyle(fontSize: 12))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 15),
                ],

                if (recentBalls.isNotEmpty) ...[
                  const Text("THIS OVER", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F3D3E))),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
                    ),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: recentBalls.takeLast(6).map((ball) {
                        Color bgColor;
                        String ballStr = ball.toString();
                        if (ballStr == '4') {
                          bgColor = const Color(0xFF00A550);
                        } else if (ballStr == '6') {
                          bgColor = const Color(0xFF6A1B9A);
                        } else if (ballStr.toUpperCase() == 'W') {
                          bgColor = Colors.red;
                        } else if (ballStr == 'WD' || ballStr == 'NB') {
                          bgColor = Colors.orange;
                        } else {
                          bgColor = Colors.grey.shade600;
                        }
                        return Container(
                          width: 35,
                          height: 35,
                          decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
                          child: Center(child: Text(ballStr, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12))),
                        );
                      }).toList(),
                    ),
                  ),
                ],

                const SizedBox(height: 15),

                if (recentBalls.isNotEmpty) ...[
                  const Text("COMMENTARY", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F3D3E))),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
                    ),
                    child: Column(
                      children: recentBalls.reversed.take(5).map((ball) {
                        return _buildCommentaryRow(ball, batsmen, bowler);
                      }).toList(),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentaryRow(dynamic ball, List<dynamic> batsmen, Map<String, dynamic>? bowler) {
    String ballStr = ball.toString();
    Color ballColor = Colors.grey.shade600;
    if (ballStr == '4') ballColor = const Color(0xFF00A550);
    if (ballStr == '6') ballColor = const Color(0xFF6A1B9A);
    if (ballStr.toUpperCase() == 'W') ballColor = Colors.red;

    String strikerName = 'Batsman';
    if (batsmen.isNotEmpty) {
      for (var bat in batsmen) {
        if (bat['isOnStrike'] == true) {
          strikerName = bat['name']?.toString() ?? 'Batsman';
          break;
        }
      }
    }
    String bowlerName = bowler?['name']?.toString() ?? 'Bowler';

    String commentary = "";
    if (ballStr == '4') {
      commentary = "FOUR! $strikerName hits a boundary";
    } else if (ballStr == '6') {
      commentary = "SIX! $strikerName goes big";
    } else if (ballStr.toUpperCase() == 'W') {
      commentary = "WICKET! $strikerName is out";
    } else if (ballStr == '0') {
      commentary = "No run, dot ball";
    } else {
      commentary = "$ballStr run${ballStr == '1' ? '' : 's'}";
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: ballColor, shape: BoxShape.circle),
            child: Center(child: Text(ballStr, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11))),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("$bowlerName to $strikerName", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                Text(commentary, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==================== SCORECARD TAB ====================
  Widget _buildScorecardTab(Map<String, dynamic> data, String team1, String team2, String score, String overs, int totalOvers, List<dynamic> batsmen, Map<String, dynamic>? bowler, List<dynamic> bowlersHistory, List<dynamic> recentBalls) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0F3D3E),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              children: [
                Text("$team1 vs $team2", style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text("$score ($overs / $totalOvers Overs)", style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text("BATTING", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F3D3E))),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.grey.shade50,
                  child: Row(
                    children: [
                      const Expanded(flex: 3, child: Text("BATSMAN", style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("R", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("B", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("4s", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("6s", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("SR", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                    ],
                  ),
                ),
                ...batsmen.map((bat) {
                  final b = bat as Map<String, dynamic>;
                  bool isOnStrike = b['isOnStrike'] == true;
                  int runs = b['runs'] ?? 0;
                  int balls = b['balls'] ?? 0;
                  int fours = b['fours'] ?? 0;
                  int sixes = b['sixes'] ?? 0;
                  String sr = balls > 0 ? ((runs / balls) * 100).toStringAsFixed(2) : "0.00";
                  return Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.grey.shade100))),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Row(
                            children: [
                              Flexible(child: Text(b['name']?.toString() ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), overflow: TextOverflow.ellipsis)),
                              if (isOnStrike) const Text(" *", style: TextStyle(color: Color(0xFF00A550), fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        Expanded(child: Text("$runs", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold))),
                        Expanded(child: Text("$balls", textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
                        Expanded(child: Text("$fours", textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
                        Expanded(child: Text("$sixes", textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
                        Expanded(child: Text(sr, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12))),
                      ],
                    ),
                  );
                }),
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.grey.shade50,
                  child: Row(
                    children: [
                      const Expanded(flex: 3, child: Text("TOTAL", style: TextStyle(fontWeight: FontWeight.bold))),
                      Expanded(child: Text("")),
                      Expanded(child: Text("")),
                      Expanded(child: Text("")),
                      Expanded(child: Text("")),
                      Expanded(child: Text("$score ($overs)", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F3D3E)))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text("BOWLING", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F3D3E))),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 5, offset: const Offset(0, 2))],
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.grey.shade50,
                  child: Row(
                    children: [
                      const Expanded(flex: 3, child: Text("BOWLER", style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("O", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("M", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("R", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("W", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                      Expanded(child: Text("ECO", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold))),
                    ],
                  ),
                ),
                if (bowlersHistory.isNotEmpty)
                  ...bowlersHistory.map((b) => _buildBowlerRow(b as Map<String, dynamic>, false))
                else if (bowler != null)
                  _buildBowlerRow(bowler, true)
                else
                  const Padding(padding: EdgeInsets.all(20), child: Text("No bowlers yet")),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBowlerRow(Map<String, dynamic> bowler, bool isCurrent) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
        color: isCurrent ? const Color(0xFFE8F5E9) : null,
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Row(
              children: [
                Flexible(child: Text(bowler['name']?.toString() ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), overflow: TextOverflow.ellipsis)),
                if (isCurrent) const Text(" *", style: TextStyle(color: Color(0xFF00A550), fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Expanded(child: Text("${bowler['overs'] ?? '0.0'}", textAlign: TextAlign.center)),
          Expanded(child: Text("${bowler['maidens'] ?? 0}", textAlign: TextAlign.center)),
          Expanded(child: Text("${bowler['runs'] ?? 0}", textAlign: TextAlign.center)),
          Expanded(child: Text("${bowler['wickets'] ?? 0}", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold))),
          Expanded(child: Text(_calculateBowlerEconomy(bowler), textAlign: TextAlign.center, style: const TextStyle(fontSize: 12))),
        ],
      ),
    );
  }

  // ==================== SQUADS TAB ====================
  Widget _buildSquadsTab(String team1, String team2) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: const Color(0xFF0F3D3E),
              unselectedLabelColor: Colors.grey,
              indicatorColor: const Color(0xFF00A550),
              tabs: [
                Tab(text: team1),
                Tab(text: team2),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildTeamSquad(team1),
                _buildTeamSquad(team2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamSquad(String teamName) {
    return FutureBuilder<QuerySnapshot>(
      future: FirebaseFirestore.instance
          .collection('players')
          .where('teamName', isEqualTo: teamName)
          .get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final players = snapshot.data!.docs;

        if (players.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline, size: 60, color: Colors.grey.shade400),
                const SizedBox(height: 10),
                Text("No players in $teamName", style: TextStyle(color: Colors.grey.shade600)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(15),
          itemCount: players.length,
          itemBuilder: (context, index) {
            final player = players[index].data() as Map<String, dynamic>;
            final playerName = player['playerName'] ?? 'Unknown';
            final role = player['role'] ?? 'Player';
            final jersey = player['jerseyNumber'] ?? 0;

            IconData roleIcon;
            MaterialColor roleColor;  // ✅ FIXED: Changed from Color to MaterialColor
            if (role.toLowerCase().contains('bat')) {
              roleIcon = Icons.sports_cricket;
              roleColor = Colors.blue;
            } else if (role.toLowerCase().contains('bowl')) {
              roleIcon = Icons.sports_baseball;
              roleColor = Colors.red;
            } else if (role.toLowerCase().contains('keeper')) {
              roleIcon = Icons.shield;
              roleColor = Colors.orange;
            } else {
              roleIcon = Icons.star;
              roleColor = Colors.purple;
            }

            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: roleColor.shade100,
                  child: Icon(roleIcon, color: roleColor),
                ),
                title: Text(playerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(role, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                trailing: jersey > 0 ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Text("#$jersey", style: const TextStyle(fontWeight: FontWeight.bold)),
                ) : null,
              ),
            );
          },
        );
      },
    );
  }

  // ==================== POINTS TABLE TAB ====================
  Widget _buildPointsTableTab(String tournamentId) {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('tournaments').doc(tournamentId).snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final data = snapshot.data!.data() as Map<String, dynamic>;
        final pointsTable = data['pointsTable'] as Map<String, dynamic>? ?? {};

        List<MapEntry<String, dynamic>> sortedTeams = pointsTable.entries.toList();
        sortedTeams.sort((a, b) {
          int pointsA = a.value['points'] ?? 0;
          int pointsB = b.value['points'] ?? 0;
          if (pointsB != pointsA) return pointsB.compareTo(pointsA);
          double nrrA = (a.value['nrr'] ?? 0.0).toDouble();
          double nrrB = (b.value['nrr'] ?? 0.0).toDouble();
          return nrrB.compareTo(nrrA);
        });

        return Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(15),
              color: const Color(0xFF0F3D3E),
              child: Text(
                data['name'] ?? 'Tournament',
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(15),
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 30),
                        Expanded(flex: 3, child: Text("TEAM", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                        Expanded(child: Text("P", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                        Expanded(child: Text("W", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                        Expanded(child: Text("L", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                        Expanded(child: Text("NRR", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                        Expanded(child: Text("PTS", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...sortedTeams.asMap().entries.map((entry) {
                    int position = entry.key + 1;
                    String teamName = entry.value.key;
                    Map<String, dynamic> stats = entry.value.value as Map<String, dynamic>;
                    int played = stats['played'] ?? 0;
                    int won = stats['won'] ?? 0;
                    int lost = stats['lost'] ?? 0;
                    double nrr = (stats['nrr'] ?? 0.0).toDouble();
                    int points = stats['points'] ?? 0;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 3, offset: const Offset(0, 1))],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 30,
                            child: Text(
                              "$position",
                              style: TextStyle(fontWeight: FontWeight.bold, color: position <= 4 ? const Color(0xFF00A550) : Colors.grey.shade700, fontSize: 16),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: Colors.blue.shade100,
                                  child: Text(teamName.isNotEmpty ? teamName[0].toUpperCase() : 'T', style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                Flexible(child: Text(teamName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          ),
                          Expanded(child: Text("$played", textAlign: TextAlign.center)),
                          Expanded(child: Text("$won", textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF00A550)))),
                          Expanded(child: Text("$lost", textAlign: TextAlign.center, style: const TextStyle(color: Colors.red))),
                          Expanded(child: Text(nrr.toStringAsFixed(2), textAlign: TextAlign.center, style: TextStyle(color: nrr >= 0 ? const Color(0xFF00A550) : Colors.red, fontWeight: FontWeight.bold, fontSize: 12))),
                          Expanded(child: Text("$points", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F3D3E)))),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildNoPointsTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.table_chart_outlined, size: 60, color: Colors.grey.shade400),
          const SizedBox(height: 10),
          Text("Not part of a tournament", style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
        ],
      ),
    );
  }
}

extension ListExtension<T> on List<T> {
  List<T> takeLast(int n) {
    if (length <= n) return this;
    return sublist(length - n);
  }
}