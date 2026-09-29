import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'team_details_screen.dart';
import 'add_team_screen.dart';
import '../utils/admin_helper.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class TeamsScreen extends StatelessWidget {
  const TeamsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bool isAdmin = AdminHelper.isAdmin();
    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(
        title: const Text('TEAMS', style: TextStyle(letterSpacing: 1)),
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(context, appRoute(const AddTeamScreen()));
              },
              child: const Icon(Icons.add),
            )
          : null,
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('teams').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const LoadingState();
          }

          final teams = snapshot.data!.docs;

          if (teams.isEmpty) {
            return const EmptyState(icon: Icons.groups_outlined, title: 'No teams found');
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: teams.length,
            itemBuilder: (context, index) {
              final team = teams[index].data() as Map<String, dynamic>;
              final teamName = (team['teamName'] ?? 'Team ${index + 1}').toString();
              final playerCount = team['playerCount'] ?? 0;
              final logoUrl = (team['logoUrl'] ?? '').toString();

              return FadeSlideIn(
                delay: Duration(milliseconds: 35 * (index % 10)),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppCard(
                    onTap: () {
                      Navigator.push(
                        context,
                        appRoute(TeamDetailsScreen(teamId: teams[index].id, teamData: team)),
                      );
                    },
                    child: Row(
                      children: [
                        InitialAvatar(text: teamName, radius: 26, imageUrl: logoUrl),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(teamName, style: CricTheme.headingMedium),
                              const SizedBox(height: 4),
                              Text('Players: $playerCount', style: CricTheme.labelMuted),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, color: CricTheme.textMuted, size: 15),
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
