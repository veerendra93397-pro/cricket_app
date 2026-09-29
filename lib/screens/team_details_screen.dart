import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class TeamDetailsScreen extends StatelessWidget {
  final String teamId;
  final Map<String, dynamic> teamData;

  const TeamDetailsScreen({
    super.key,
    required this.teamId,
    required this.teamData,
  });

  @override
  Widget build(BuildContext context) {
    final teamName = (teamData['teamName'] ?? 'Team').toString();
    final logoUrl = (teamData['logoUrl'] ?? '').toString();

    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(
        title: Text(teamName.toUpperCase(), style: const TextStyle(letterSpacing: 1)),
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
            decoration: const BoxDecoration(gradient: CricTheme.headerGradient),
            child: Column(
              children: [
                InitialAvatar(text: teamName, radius: 40, imageUrl: logoUrl),
                const SizedBox(height: 14),
                Text(teamName,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('players')
                  .where('teamName', isEqualTo: teamName)
                  .snapshots(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const LoadingState();
                }

                final players = snapshot.data!.docs;

                if (players.isEmpty) {
                  return const EmptyState(icon: Icons.people_outline, title: 'No players in this team');
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: players.length,
                  itemBuilder: (context, index) {
                    final player = players[index].data() as Map<String, dynamic>;
                    final playerName = (player['playerName'] ?? 'Unknown').toString();
                    final role = (player['role'] ?? 'All-Rounder').toString();

                    return FadeSlideIn(
                      delay: Duration(milliseconds: 35 * (index % 10)),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: AppCard(
                          child: Row(
                            children: [
                              InitialAvatar(text: playerName, radius: 25),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(playerName, style: CricTheme.headingMedium),
                                    const SizedBox(height: 4),
                                    Text(role, style: CricTheme.labelMuted),
                                  ],
                                ),
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
          ),
        ],
      ),
    );
  }
}
