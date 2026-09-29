import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'player_details_screen.dart';
import 'add_player_screen.dart';
import '../utils/admin_helper.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class PlayersScreen extends StatelessWidget {
  const PlayersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bool isAdmin = AdminHelper.isAdmin();
    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(
        title: const Text('PLAYERS', style: TextStyle(letterSpacing: 1)),
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(context, appRoute(const AddPlayerScreen()));
              },
              child: const Icon(Icons.add),
            )
          : null,
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('players').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const LoadingState();
          }

          final players = snapshot.data!.docs;

          if (players.isEmpty) {
            return const EmptyState(icon: Icons.people_outline, title: 'No players found');
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: players.length,
            itemBuilder: (context, index) {
              final player = players[index].data() as Map<String, dynamic>;
              final playerName = (player['playerName'] ?? 'Unknown').toString();
              final role = (player['role'] ?? 'All-Rounder').toString();
              final team = (player['teamName'] ?? '').toString();

              return FadeSlideIn(
                delay: Duration(milliseconds: 35 * (index % 10)),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppCard(
                    onTap: () {
                      Navigator.push(
                        context,
                        appRoute(PlayerDetailsScreen(playerData: player, playerId: players[index].id)),
                      );
                    },
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
                              if (team.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(team,
                                    style: const TextStyle(
                                        color: CricTheme.accentDeep, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ],
                          ),
                        ),
                        if (isAdmin) const Icon(Icons.edit_outlined, color: CricTheme.textMuted, size: 20),
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
}
