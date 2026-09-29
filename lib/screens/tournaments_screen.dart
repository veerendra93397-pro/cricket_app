import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/admin_helper.dart';
import 'create_tournament_screen.dart';
import 'tournament_details_screen.dart';

class TournamentsScreen extends StatelessWidget {
  const TournamentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bool isAdmin = AdminHelper.isAdmin();

    return Scaffold(
      appBar: AppBar(        title: const Text("Tournaments", style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CreateTournamentScreen()),
                );
              },
            ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('tournaments').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.emoji_events, size: 80, color: Colors.grey[400]),
                  const SizedBox(height: 20),
                  const Text("No tournaments yet", style: TextStyle(fontSize: 18, color: Colors.grey)),
                  if (isAdmin) ...[
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateTournamentScreen()));
                      },
                      icon: const Icon(Icons.add),
                      label: const Text("Create Tournament"),
                    ),
                  ],
                ],
              ),
            );
          }

          final tournaments = snapshot.data!.docs;

          return ListView.builder(
            padding: const EdgeInsets.all(15),
            itemCount: tournaments.length,
            itemBuilder: (context, index) {
              final tournament = tournaments[index].data() as Map<String, dynamic>;
              final tournamentId = tournaments[index].id;
              final name = tournament['name'] ?? 'Tournament';
              final status = tournament['status'] ?? 'upcoming';
              final teams = (tournament['teams'] as List?) ?? [];
              final totalMatches = (tournament['totalMatches'] ?? 0) as int;
              final completedMatches = (tournament['completedMatches'] ?? 0) as int;
              final stage = tournament['stage'] ?? 'group';

              Color statusColor;
              IconData statusIcon;
              switch (status) {
                case 'ongoing':
                  statusColor = Colors.green;
                  statusIcon = Icons.play_circle;
                  break;
                case 'completed':
                  statusColor = Colors.blue;
                  statusIcon = Icons.check_circle;
                  break;
                default:
                  statusColor = Colors.orange;
                  statusIcon = Icons.schedule;
              }

              return Card(
                margin: const EdgeInsets.only(bottom: 15),
                elevation: 3,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => TournamentDetailsScreen(
                          tournamentId: tournamentId,
                          tournamentData: tournament,
                        ),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(15),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(statusIcon, color: statusColor, size: 30),
                            ),
                            const SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 5),
                                  Text("${teams.length} Teams • $totalMatches Matches", style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                                  if (stage != 'group')
                                    Text("Stage: ${stage.toUpperCase()}", style: TextStyle(color: Colors.purple.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            // ✅ FIX PENDING FINALS BUTTON
                            if (isAdmin && stage == 'playoffs')
                              IconButton(
                                icon: const Icon(Icons.build, color: Colors.purple, size: 22),
                                onPressed: () => _fixPendingFinals(context, tournamentId),
                                tooltip: "Fix Pending Finals",
                              ),
                            if (isAdmin)
                              IconButton(
                                icon: const Icon(Icons.sync, color: Colors.blue, size: 22),
                                onPressed: () => _refreshTournamentProgress(context, tournamentId, totalMatches, tournament),
                                tooltip: "Refresh Progress",
                              ),
                            if (isAdmin)
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red, size: 22),
                                onPressed: () => _showDeleteDialog(context, tournamentId, name, totalMatches),
                                tooltip: "Delete Tournament",
                              ),
                          ],
                        ),
                        const SizedBox(height: 15),
                        if (totalMatches > 0) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: LinearProgressIndicator(
                              value: totalMatches > 0 ? completedMatches / totalMatches : 0,
                              backgroundColor: Colors.grey[200],
                              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                              minHeight: 8,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text("$completedMatches / $totalMatches matches completed", style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(15),
                              ),
                              child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                            const Spacer(),
                            if (isAdmin && completedMatches >= totalMatches && stage == 'group')
                              ElevatedButton.icon(
                                onPressed: () => _generatePlayoffs(context, tournamentId, tournament),
                                icon: const Icon(Icons.emoji_events, size: 16),
                                label: const Text("Generate Playoffs", style: TextStyle(fontSize: 12)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.purple,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  // ✅ FIX PENDING FINALS - Automatically updates Final match with winner
  Future<void> _fixPendingFinals(BuildContext context, String tournamentId) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 15),
                  Text("Fixing pending finals..."),
                ],
              ),
            ),
          ),
        ),
      );

      // Get all completed qualifiers/semi-finals
      QuerySnapshot qualifiers = await FirebaseFirestore.instance
          .collection('matches')
          .where('tournamentId', isEqualTo: tournamentId)
          .where('matchType', whereIn: ['qualifier', 'semi_final_1', 'semi_final_2'])
          .where('status', isEqualTo: 'completed')
          .get();

      // Get the Final match
      QuerySnapshot finals = await FirebaseFirestore.instance
          .collection('matches')
          .where('tournamentId', isEqualTo: tournamentId)
          .where('matchType', isEqualTo: 'final')
          .get();

      if (finals.docs.isEmpty) {
        if (context.mounted) Navigator.pop(context);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("No Final match found"), backgroundColor: Colors.orange),
          );
        }
        return;
      }

      String finalMatchId = finals.docs.first.id;
      Map<String, dynamic> finalData = finals.docs.first.data() as Map<String, dynamic>;

      // Find which team slot has TBD
      String teamToUpdate = 'team2';
      if (finalData['team1'].toString().contains('TBD')) {
        teamToUpdate = 'team1';
      }

      // Get the winner from completed qualifiers
      bool updated = false;
      for (var qualifier in qualifiers.docs) {
        Map<String, dynamic> qData = qualifier.data() as Map<String, dynamic>;
        String winner = qData['winner'] ?? '';
        
        if (winner.isNotEmpty && winner != 'Tied') {
          await FirebaseFirestore.instance
              .collection('matches')
              .doc(finalMatchId)
              .update({teamToUpdate: winner});
          
          updated = true;
          break;
        }
      }

      if (context.mounted) Navigator.pop(context);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(updated ? "✅ Final match updated!" : "⚠️ No completed qualifiers found"),
            backgroundColor: updated ? Colors.green : Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  // ✅ AUTO-GENERATE PLAYOFFS WHEN REFRESH IS CLICKED
  Future<void> _refreshTournamentProgress(BuildContext context, String tournamentId, int totalMatches, Map<String, dynamic> tournament) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 15),
                  Text("Refreshing progress..."),
                ],
              ),
            ),
          ),
        ),
      );

      QuerySnapshot completedMatchesSnapshot = await FirebaseFirestore.instance
          .collection('matches')
          .where('tournamentId', isEqualTo: tournamentId)
          .where('status', isEqualTo: 'completed')
          .get();

      int completedCount = completedMatchesSnapshot.docs.length;

      String newStatus = 'upcoming';
      if (completedCount == totalMatches && totalMatches > 0) {
        newStatus = 'completed';
      } else if (completedCount > 0) {
        newStatus = 'ongoing';
      }

      await FirebaseFirestore.instance.collection('tournaments').doc(tournamentId).update({
        'completedMatches': completedCount,
        'status': newStatus,
      });

      // ✅ AUTO-GENERATE PLAYOFFS IF GROUP STAGE IS COMPLETE
      String stage = tournament['stage'] ?? 'group';
      if (completedCount >= totalMatches && stage == 'group') {
        if (context.mounted) Navigator.pop(context);
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("✅ Group stage complete! Generating playoffs..."),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        }
        
        await _generatePlayoffs(context, tournamentId, tournament);
        return;
      }

      if (context.mounted) Navigator.pop(context);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("✅ Updated: $completedCount / $totalMatches matches completed"),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  // ✅ GENERATE PLAYOFFS - Creates Qualifier and Final
  Future<void> _generatePlayoffs(BuildContext context, String tournamentId, Map<String, dynamic> tournament) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 15),
                  Text("Generating Playoffs..."),
                ],
              ),
            ),
          ),
        ),
      );

      Map<String, dynamic> pointsTable = tournament['pointsTable'] ?? {};
      List<MapEntry<String, dynamic>> sortedTeams = pointsTable.entries.toList();
      sortedTeams.sort((a, b) {
        int pointsA = a.value['points'] ?? 0;
        int pointsB = b.value['points'] ?? 0;
        if (pointsB != pointsA) return pointsB.compareTo(pointsA);
        double nrrA = (a.value['nrr'] ?? 0.0).toDouble();
        double nrrB = (b.value['nrr'] ?? 0.0).toDouble();
        return nrrB.compareTo(nrrA);
      });

      List<String> topTeams = sortedTeams.take(4).map((e) => e.key).toList();

      if (topTeams.length < 2) {
        if (context.mounted) Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Need at least 2 teams for playoffs"), backgroundColor: Colors.red),
        );
        return;
      }

      int oversPerMatch = tournament['oversPerMatch'] ?? 20;
      String tournamentName = tournament['name'] ?? 'Tournament';

      WriteBatch batch = FirebaseFirestore.instance.batch();

      if (topTeams.length == 4) {
        DocumentReference sf1Ref = FirebaseFirestore.instance.collection('matches').doc();
        batch.set(sf1Ref, {
          'tournamentId': tournamentId,
          'tournamentName': tournamentName,
          'team1': topTeams[0],
          'team2': topTeams[3],
          'status': 'upcoming',
          'totalOvers': oversPerMatch,
          'venue': 'Semi-Final 1',
          'matchType': 'semi_final_1',
          'stage': 'playoffs',
          'matchDate': FieldValue.serverTimestamp(),
          'team1Score': '0/0',
          'team1Overs': '0.0',
          'team1Runs': 0,
          'team1Wickets': 0,
        });

        DocumentReference sf2Ref = FirebaseFirestore.instance.collection('matches').doc();
        batch.set(sf2Ref, {
          'tournamentId': tournamentId,
          'tournamentName': tournamentName,
          'team1': topTeams[1],
          'team2': topTeams[2],
          'status': 'upcoming',
          'totalOvers': oversPerMatch,
          'venue': 'Semi-Final 2',
          'matchType': 'semi_final_2',
          'stage': 'playoffs',
          'matchDate': FieldValue.serverTimestamp(),
          'team1Score': '0/0',
          'team1Overs': '0.0',
          'team1Runs': 0,
          'team1Wickets': 0,
        });

        DocumentReference finalRef = FirebaseFirestore.instance.collection('matches').doc();
        batch.set(finalRef, {
          'tournamentId': tournamentId,
          'tournamentName': tournamentName,
          'team1': 'TBD (SF1 Winner)',
          'team2': 'TBD (SF2 Winner)',
          'status': 'upcoming',
          'totalOvers': oversPerMatch,
          'venue': 'Final',
          'matchType': 'final',
          'stage': 'final',
          'matchDate': FieldValue.serverTimestamp(),
          'team1Score': '0/0',
          'team1Overs': '0.0',
          'team1Runs': 0,
          'team1Wickets': 0,
        });
      } else if (topTeams.length == 3) {
        DocumentReference qualifierRef = FirebaseFirestore.instance.collection('matches').doc();
        batch.set(qualifierRef, {
          'tournamentId': tournamentId,
          'tournamentName': tournamentName,
          'team1': topTeams[1],
          'team2': topTeams[2],
          'status': 'upcoming',
          'totalOvers': oversPerMatch,
          'venue': 'Qualifier',
          'matchType': 'qualifier',
          'stage': 'playoffs',
          'matchDate': FieldValue.serverTimestamp(),
          'team1Score': '0/0',
          'team1Overs': '0.0',
          'team1Runs': 0,
          'team1Wickets': 0,
        });

        DocumentReference finalRef = FirebaseFirestore.instance.collection('matches').doc();
        batch.set(finalRef, {
          'tournamentId': tournamentId,
          'tournamentName': tournamentName,
          'team1': topTeams[0],
          'team2': 'TBD (Qualifier Winner)',
          'status': 'upcoming',
          'totalOvers': oversPerMatch,
          'venue': 'Final',
          'matchType': 'final',
          'stage': 'final',
          'matchDate': FieldValue.serverTimestamp(),
          'team1Score': '0/0',
          'team1Overs': '0.0',
          'team1Runs': 0,
          'team1Wickets': 0,
        });
      } else if (topTeams.length == 2) {
        DocumentReference finalRef = FirebaseFirestore.instance.collection('matches').doc();
        batch.set(finalRef, {
          'tournamentId': tournamentId,
          'tournamentName': tournamentName,
          'team1': topTeams[0],
          'team2': topTeams[1],
          'status': 'upcoming',
          'totalOvers': oversPerMatch,
          'venue': 'Final',
          'matchType': 'final',
          'stage': 'final',
          'matchDate': FieldValue.serverTimestamp(),
          'team1Score': '0/0',
          'team1Overs': '0.0',
          'team1Runs': 0,
          'team1Wickets': 0,
        });
      }

      batch.update(FirebaseFirestore.instance.collection('tournaments').doc(tournamentId), {
        'stage': 'playoffs',
        'status': 'ongoing',
        'topTeams': topTeams,
      });

      await batch.commit();

      if (context.mounted) Navigator.pop(context);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("✅ Playoffs generated! ${topTeams.length} teams qualified."),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showDeleteDialog(BuildContext context, String tournamentId, String tournamentName, int totalMatches) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red, size: 28),
            const SizedBox(width: 10),
            const Text("Delete Tournament?"),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Are you sure you want to delete \"$tournamentName\"?", style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 15),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("⚠️ This will:", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                  const SizedBox(height: 8),
                  const Text("• Delete the tournament"),
                  Text("• Delete all $totalMatches associated matches"),
                  const Text("• Remove points table data", style: TextStyle(color: Colors.red, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  const Text("This action cannot be undone!", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(context);
              await _deleteTournament(context, tournamentId, totalMatches);
            },
            icon: const Icon(Icons.delete, size: 18),
            label: const Text("Delete"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteTournament(BuildContext context, String tournamentId, int totalMatches) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 15),
                  Text("Deleting tournament..."),
                ],
              ),
            ),
          ),
        ),
      );

      QuerySnapshot matchesSnapshot = await FirebaseFirestore.instance
          .collection('matches')
          .where('tournamentId', isEqualTo: tournamentId)
          .get();

      WriteBatch batch = FirebaseFirestore.instance.batch();
      for (var doc in matchesSnapshot.docs) {
        batch.delete(doc.reference);
      }
      batch.delete(FirebaseFirestore.instance.collection('tournaments').doc(tournamentId));
      await batch.commit();

      if (context.mounted) Navigator.pop(context);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Tournament and $totalMatches matches deleted!"), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }
}