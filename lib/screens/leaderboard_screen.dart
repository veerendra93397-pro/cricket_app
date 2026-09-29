import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class LeaderboardScreen extends StatelessWidget {
  final String tournamentId;
  final String type;

  const LeaderboardScreen({
    super.key,
    required this.tournamentId,
    required this.type,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<QuerySnapshot>(
      future: FirebaseFirestore.instance
          .collection('playerStats')
          .where('tournamentId', isEqualTo: tournamentId)
          .get(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        List<Map<String, dynamic>> players = snapshot.data!.docs
            .map((doc) => doc.data() as Map<String, dynamic>)
            .toList();

        // Only show players who actually have this stat — e.g. a bowler who
        // never faced a ball shouldn't clutter the Most Runs list with a 0.
        if (type == 'runs') {
          players = players.where((p) {
            final runs = (p['totalRuns'] ?? 0) as int;
            final balls = (p['totalBalls'] ?? 0) as int;
            return runs > 0 || balls > 0;
          }).toList();
        } else {
          players = players.where((p) {
            final wickets = (p['totalWickets'] ?? 0) as int;
            final overs = (p['oversBowled'] ?? 0) as int;
            return wickets > 0 || overs > 0;
          }).toList();
        }

        // Sort based on type
        if (type == 'runs') {
          players.sort((a, b) {
            int runsA = (a['totalRuns'] ?? 0) as int;
            int runsB = (b['totalRuns'] ?? 0) as int;
            return runsB.compareTo(runsA);
          });
        } else {
          players.sort((a, b) {
            int wicketsA = (a['totalWickets'] ?? 0) as int;
            int wicketsB = (b['totalWickets'] ?? 0) as int;
            return wicketsB.compareTo(wicketsA);
          });
        }

        if (players.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  type == 'runs' ? Icons.sports_cricket : Icons.sports_baseball,
                  size: 80,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 20),
                Text(
                  "No ${type == 'runs' ? 'batting' : 'bowling'} stats yet",
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 10),
                const Text(
                  "Stats will appear after matches are completed",
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(15),
          itemCount: players.length,
          itemBuilder: (context, index) {
            final playerData = players[index];
            final playerName = playerData['playerName'] ?? 'Unknown';
            final teamName = playerData['teamName'] ?? '';
            final totalRuns = (playerData['totalRuns'] ?? 0) as int;
            final totalWickets = (playerData['totalWickets'] ?? 0) as int;
            final matches = (playerData['matches'] ?? 0) as int;
            final balls = (playerData['totalBalls'] ?? 0) as int;
            final fours = (playerData['totalFours'] ?? 0) as int;
            final sixes = (playerData['totalSixes'] ?? 0) as int;
            final oversBowled = (playerData['oversBowled'] ?? 0) as int;
            final runsConceded = (playerData['runsConceded'] ?? 0) as int;

            double strikeRate = balls > 0 ? (totalRuns / balls * 100) : 0;
            double economy = oversBowled > 0 ? (runsConceded / (oversBowled / 6)) : 0;
            double average = totalWickets > 0 ? (runsConceded / totalWickets) : 0;

            // Medal colors for top 3
            Color medalColor = Colors.grey; // ✅ Added default value
            IconData? medalIcon;
            if (index == 0) {
              medalColor = Colors.amber;
              medalIcon = Icons.emoji_events;
            } else if (index == 1) {
              medalColor = Colors.grey.shade400;
              medalIcon = Icons.emoji_events;
            } else if (index == 2) {
              medalColor = Colors.brown.shade300;
              medalIcon = Icons.emoji_events;
            }

            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    // Rank/Medal
                    Container(
                      width: 45,
                      height: 45,
                      decoration: BoxDecoration(
                        color: index < 3 ? medalColor.withValues(alpha: 0.2) : Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: index < 3
                            ? Icon(medalIcon, color: medalColor, size: 24)
                            : Text(
                                "${index + 1}",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: 15),
                    // Player Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            playerName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            teamName,
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            "$matches matches",
                            style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    // Main Stat
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: type == 'runs' ? Colors.blue.shade50 : Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Text(
                            type == 'runs' ? "$totalRuns" : "$totalWickets",
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: type == 'runs' ? Colors.blue.shade800 : Colors.green.shade800,
                            ),
                          ),
                          Text(
                            type == 'runs' ? "Runs" : "Wickets",
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Secondary Stats
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (type == 'runs') ...[
                          Text("SR: ${strikeRate.toStringAsFixed(1)}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 4),
                          Text("4s: $fours • 6s: $sixes", style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                        ] else ...[
                          Text("Econ: ${economy.toStringAsFixed(2)}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 4),
                          Text("Avg: ${average.toStringAsFixed(1)}", style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}