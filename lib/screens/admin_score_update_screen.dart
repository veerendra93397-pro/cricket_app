import 'package:flutter/material.dart';
import '../utils/cric_theme.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
/// Manual score-override screen. Use this for corrections or for setting
/// up initial match state (toss, status) — the ball-by-ball scoring during
/// play should go through LiveScoringInterface, not this screen, since
/// this screen does NOT track individual ball history or strike rotation.
class AdminScoreUpdateScreen extends StatefulWidget {
  final String matchId;
  final Map<String, dynamic> matchData;

  const AdminScoreUpdateScreen({
    super.key,
    required this.matchId,
    required this.matchData,
  });

  @override
  State<AdminScoreUpdateScreen> createState() => _AdminScoreUpdateScreenState();
}

class _AdminScoreUpdateScreenState extends State<AdminScoreUpdateScreen> {
  final _formKey = GlobalKey<FormState>();

  late String team1;
  late String team2;
  String status = 'upcoming';
  String tossWinner = '';
  String tossDecision = 'bat';

  final team1RunsController = TextEditingController();
  final team1WicketsController = TextEditingController();
  final team1OversController = TextEditingController();

  final team2RunsController = TextEditingController();
  final team2WicketsController = TextEditingController();
  final team2OversController = TextEditingController();

  final batsman1NameController = TextEditingController();
  final batsman1RunsController = TextEditingController();
  final batsman1BallsController = TextEditingController();
  final batsman1FoursController = TextEditingController();
  final batsman1SixesController = TextEditingController();
  String batsman1OnStrike = 'true';

  final batsman2NameController = TextEditingController();
  final batsman2RunsController = TextEditingController();
  final batsman2BallsController = TextEditingController();
  final batsman2FoursController = TextEditingController();
  final batsman2SixesController = TextEditingController();

  final bowlerNameController = TextEditingController();
  final bowlerOversController = TextEditingController();
  final bowlerRunsController = TextEditingController();
  final bowlerWicketsController = TextEditingController();
  final bowlerMaidensController = TextEditingController();

  final recentBallController = TextEditingController();
  List<String> recentBallsList = [];

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadExistingData();
  }

  void _loadExistingData() {
    team1 = widget.matchData['team1'] ?? 'Team 1';
    team2 = widget.matchData['team2'] ?? 'Team 2';
    status = widget.matchData['status'] ?? 'upcoming';
    // ✅ guard against statuses this dropdown doesn't know about
    // (e.g. 'innings_break' written by the live scorer) so
    // DropdownButtonFormField doesn't crash on an unmatched value.
    const knownStatuses = ['upcoming', 'live', 'innings_break', 'completed'];
    if (!knownStatuses.contains(status)) status = 'upcoming';

    tossWinner = widget.matchData['tossWinner'] ?? '';
    tossDecision = widget.matchData['tossDecision'] ?? 'bat';

    // ✅ Read from team1Runs/team1Wickets (the source of truth used by
    // the live scorer) rather than only team1Score, so this screen and
    // the live scorer never drift out of sync with each other.
    int t1Runs = widget.matchData['team1Runs'] ?? 0;
    int t1Wkts = widget.matchData['team1Wickets'] ?? 0;
    team1RunsController.text = t1Runs.toString();
    team1WicketsController.text = t1Wkts.toString();
    team1OversController.text = widget.matchData['team1Overs']?.toString() ?? '0.0';

    int t2Runs = widget.matchData['team2Runs'] ?? 0;
    int t2Wkts = widget.matchData['team2Wickets'] ?? 0;
    team2RunsController.text = t2Runs.toString();
    team2WicketsController.text = t2Wkts.toString();
    team2OversController.text = widget.matchData['team2Overs']?.toString() ?? '0.0';

    List<dynamic> existingBalls = widget.matchData['recentBalls'] ?? [];
    recentBallsList = existingBalls.map((b) => b.toString()).toList();

    List<dynamic> batsmen = widget.matchData['currentBatsmen'] ?? [];
    if (batsmen.isNotEmpty) {
      final bat1 = batsmen[0] as Map<String, dynamic>;
      batsman1NameController.text = bat1['name']?.toString() ?? '';
      batsman1RunsController.text = bat1['runs']?.toString() ?? '0';
      batsman1BallsController.text = bat1['balls']?.toString() ?? '0';
      batsman1FoursController.text = bat1['fours']?.toString() ?? '0';
      batsman1SixesController.text = bat1['sixes']?.toString() ?? '0';
      batsman1OnStrike = bat1['isOnStrike'] == true ? 'true' : 'false';
    }
    if (batsmen.length > 1) {
      final bat2 = batsmen[1] as Map<String, dynamic>;
      batsman2NameController.text = bat2['name']?.toString() ?? '';
      batsman2RunsController.text = bat2['runs']?.toString() ?? '0';
      batsman2BallsController.text = bat2['balls']?.toString() ?? '0';
      batsman2FoursController.text = bat2['fours']?.toString() ?? '0';
      batsman2SixesController.text = bat2['sixes']?.toString() ?? '0';
    }

    final bowlerData = widget.matchData['currentBowler'] as Map<String, dynamic>?;
    if (bowlerData != null) {
      bowlerNameController.text = bowlerData['name']?.toString() ?? '';
      bowlerOversController.text = bowlerData['overs']?.toString() ?? '0.0';
      bowlerRunsController.text = bowlerData['runs']?.toString() ?? '0';
      bowlerWicketsController.text = bowlerData['wickets']?.toString() ?? '0';
      bowlerMaidensController.text = bowlerData['maidens']?.toString() ?? '0';
    }
  }

  Future<void> _updateScore() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      int t1Runs = int.tryParse(team1RunsController.text) ?? 0;
      int t1Wkts = int.tryParse(team1WicketsController.text) ?? 0;
      int t2Runs = int.tryParse(team2RunsController.text) ?? 0;
      int t2Wkts = int.tryParse(team2WicketsController.text) ?? 0;

      Map<String, dynamic> updateData = {
        'team1': team1,
        'team2': team2,
        'status': status,
        'tossWinner': tossWinner,
        'tossDecision': tossDecision,

        // ✅ Write BOTH the integer fields (used by the live scorer's
        // math) AND the display string (used by viewer screens) so
        // nothing drifts out of sync after a manual edit.
        'team1Runs': t1Runs,
        'team1Wickets': t1Wkts,
        'team1Overs': team1OversController.text,
        'team1Score': "$t1Runs/$t1Wkts",

        'team2Runs': t2Runs,
        'team2Wickets': t2Wkts,
        'team2Overs': team2OversController.text,
        'team2Score': "$t2Runs/$t2Wkts",

        'recentBalls': recentBallsList,
      };

      if (batsman1NameController.text.trim().isNotEmpty) {
        List<Map<String, dynamic>> batsmenList = [
          {
            'name': batsman1NameController.text.trim(),
            'runs': int.tryParse(batsman1RunsController.text) ?? 0,
            'balls': int.tryParse(batsman1BallsController.text) ?? 0,
            'fours': int.tryParse(batsman1FoursController.text) ?? 0,
            'sixes': int.tryParse(batsman1SixesController.text) ?? 0,
            'isOnStrike': batsman1OnStrike == 'true',
          },
        ];
        if (batsman2NameController.text.trim().isNotEmpty) {
          batsmenList.add({
            'name': batsman2NameController.text.trim(),
            'runs': int.tryParse(batsman2RunsController.text) ?? 0,
            'balls': int.tryParse(batsman2BallsController.text) ?? 0,
            'fours': int.tryParse(batsman2FoursController.text) ?? 0,
            'sixes': int.tryParse(batsman2SixesController.text) ?? 0,
            // ✅ guarantee exactly one striker — second batsman is always
            // non-striker, regardless of the first batsman's flag, so we
            // never end up with both or neither on strike.
            'isOnStrike': batsman1OnStrike != 'true',
          });
        }
        updateData['currentBatsmen'] = batsmenList;
      }

      if (bowlerNameController.text.trim().isNotEmpty) {
        updateData['currentBowler'] = {
          'name': bowlerNameController.text.trim(),
          'overs': bowlerOversController.text,
          'runs': int.tryParse(bowlerRunsController.text) ?? 0,
          'wickets': int.tryParse(bowlerWicketsController.text) ?? 0,
          'maidens': int.tryParse(bowlerMaidensController.text) ?? 0,
        };
      }

      await FirebaseFirestore.instance
          .collection('matches')
          .doc(widget.matchId)
          .update(updateData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Score updated successfully"), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _addRecentBall() {
    if (recentBallController.text.trim().isNotEmpty) {
      setState(() {
        recentBallsList.add(recentBallController.text.trim());
        recentBallController.clear();
      });
    }
  }

  void _removeRecentBall(int index) {
    setState(() => recentBallsList.removeAt(index));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(        elevation: 0,
        title: Text("Update score - $team1 vs $team2"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(15),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle("Match Status"),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: status,
                decoration: const InputDecoration(border: OutlineInputBorder(), labelText: "Status"),
                items: const [
                  DropdownMenuItem(value: 'upcoming', child: Text('Upcoming')),
                  DropdownMenuItem(value: 'live', child: Text('Live')),
                  DropdownMenuItem(value: 'innings_break', child: Text('Innings Break')),
                  DropdownMenuItem(value: 'completed', child: Text('Completed')),
                ],
                onChanged: (val) => setState(() => status = val!),
              ),
              const SizedBox(height: 20),
              _buildSectionTitle("Toss Details"),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: tossWinner.isNotEmpty ? tossWinner : null,
                decoration: const InputDecoration(border: OutlineInputBorder(), labelText: "Toss Winner"),
                items: [team1, team2]
                    .map((team) => DropdownMenuItem(value: team, child: Text(team)))
                    .toList(),
                onChanged: (val) => setState(() => tossWinner = val!),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: tossDecision,
                decoration: const InputDecoration(border: OutlineInputBorder(), labelText: "Decision"),
                items: const [
                  DropdownMenuItem(value: 'bat', child: Text('Bat First')),
                  DropdownMenuItem(value: 'bowl', child: Text('Bowl First')),
                ],
                onChanged: (val) => setState(() => tossDecision = val!),
              ),
              const SizedBox(height: 20),
              _buildSectionTitle("$team1 - Score"),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: team1RunsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: "Runs", border: OutlineInputBorder()),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: team1WicketsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: "Wickets", border: OutlineInputBorder()),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: team1OversController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: "Overs", border: OutlineInputBorder()),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _buildSectionTitle("$team2 - Score"),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: team2RunsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: "Runs", border: OutlineInputBorder()),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: team2WicketsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: "Wickets", border: OutlineInputBorder()),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: team2OversController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: "Overs", border: OutlineInputBorder()),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _buildSectionTitle("Current Batsmen (Optional)"),
              const SizedBox(height: 10),
              _buildBatsmanFields(
                "Batsman 1",
                batsman1NameController,
                batsman1RunsController,
                batsman1BallsController,
                batsman1FoursController,
                batsman1SixesController,
                onStrikeValue: batsman1OnStrike,
                onStrikeChanged: (val) => setState(() => batsman1OnStrike = val),
              ),
              const SizedBox(height: 15),
              _buildBatsmanFields(
                "Batsman 2",
                batsman2NameController,
                batsman2RunsController,
                batsman2BallsController,
                batsman2FoursController,
                batsman2SixesController,
              ),
              const SizedBox(height: 20),
              _buildSectionTitle("Current Bowler (Optional)"),
              const SizedBox(height: 10),
              _buildBowlerFields(),
              const SizedBox(height: 20),
              _buildSectionTitle("Recent Balls"),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: recentBallController,
                      decoration: const InputDecoration(
                        labelText: "Ball Result (0,1,2,4,6,W,WD,NB)",
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(onPressed: _addRecentBall, child: const Text("ADD")),
                ],
              ),
              const SizedBox(height: 10),
              if (recentBallsList.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: recentBallsList.asMap().entries.map((entry) {
                    int index = entry.key;
                    String ball = entry.value;
                    Color bgColor = Colors.grey;
                    if (ball == '4') bgColor = CricTheme.primary;
                    if (ball == '6') bgColor = Colors.green;
                    if (ball.toUpperCase() == 'W') bgColor = Colors.red;
                    if (ball == 'WD' || ball == 'NB') bgColor = Colors.orange;

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(15)),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(ball, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 5),
                          GestureDetector(
                            onTap: () => _removeRecentBall(index),
                            child: const Icon(Icons.close, color: Colors.white, size: 16),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _updateScore,
                  style: ElevatedButton.styleFrom(backgroundColor: CricTheme.primary, foregroundColor: Colors.white),
                  child: _isSaving
                      ? const SizedBox(
                          width: 24, height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text("UPDATE SCORE", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: CricTheme.primary));
  }

  Widget _buildBatsmanFields(
    String label,
    TextEditingController nameCtrl,
    TextEditingController runsCtrl,
    TextEditingController ballsCtrl,
    TextEditingController foursCtrl,
    TextEditingController sixesCtrl, {
    String? onStrikeValue,
    ValueChanged<String>? onStrikeChanged,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            TextFormField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: "Name", border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: runsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Runs", border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: ballsCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Balls", border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: foursCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "4s", border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: sixesCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "6s", border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            if (onStrikeValue != null && onStrikeChanged != null) ...[
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: onStrikeValue,
                decoration: const InputDecoration(labelText: "On Strike?", border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'true', child: Text('Yes (On Strike)')),
                  DropdownMenuItem(value: 'false', child: Text('No')),
                ],
                onChanged: (val) => onStrikeChanged(val!),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBowlerFields() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextFormField(
              controller: bowlerNameController,
              decoration: const InputDecoration(labelText: "Bowler Name", border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: bowlerOversController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Overs", border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: bowlerMaidensController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Maidens", border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: bowlerRunsController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Runs", border: OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: bowlerWicketsController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: "Wickets", border: OutlineInputBorder()),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    team1RunsController.dispose();
    team1WicketsController.dispose();
    team1OversController.dispose();
    team2RunsController.dispose();
    team2WicketsController.dispose();
    team2OversController.dispose();
    batsman1NameController.dispose();
    batsman1RunsController.dispose();
    batsman1BallsController.dispose();
    batsman1FoursController.dispose();
    batsman1SixesController.dispose();
    batsman2NameController.dispose();
    batsman2RunsController.dispose();
    batsman2BallsController.dispose();
    batsman2FoursController.dispose();
    batsman2SixesController.dispose();
    bowlerNameController.dispose();
    bowlerOversController.dispose();
    bowlerRunsController.dispose();
    bowlerWicketsController.dispose();
    bowlerMaidensController.dispose();
    recentBallController.dispose();
    super.dispose();
  }
}
