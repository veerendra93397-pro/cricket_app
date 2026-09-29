import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/admin_helper.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';
import 'match_setup_screen.dart';
import 'live_score_screen.dart';

class MatchesScreen extends StatefulWidget {
  const MatchesScreen({super.key});

  @override
  State<MatchesScreen> createState() => _MatchesScreenState();
}

class _MatchesScreenState extends State<MatchesScreen> {
  String selectedTab = 'upcoming';
  Map<String, String> _teamLogos = {};

  @override
  void initState() {
    super.initState();
    _loadTeamLogos();
  }

  Future<void> _loadTeamLogos() async {
    final snapshot = await FirebaseFirestore.instance.collection('teams').get();
    final logos = <String, String>{};
    for (final doc in snapshot.docs) {
      final data = doc.data();
      final name = (data['teamName'] ?? '').toString();
      final logoUrl = (data['logoUrl'] ?? '').toString();
      if (name.isNotEmpty && logoUrl.isNotEmpty) {
        logos[name] = logoUrl;
      }
    }
    if (mounted) {
      setState(() => _teamLogos = logos);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isAdmin = AdminHelper.isAdmin();

    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(
        title: const Text('Match Schedule'),
      ),
      body: Column(
        children: [
          Container(
            color: CricTheme.surface,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Expanded(child: _buildTabButton('upcoming', 'Upcoming', Icons.calendar_today)),
                const SizedBox(width: 8),
                Expanded(child: _buildTabButton('live', 'Live', Icons.live_tv)),
                const SizedBox(width: 8),
                Expanded(child: _buildTabButton('completed', 'Completed', Icons.check_circle)),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('matches')
                  .where('status', isEqualTo: selectedTab)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const LoadingState();
                }

                if (snapshot.hasError) {
                  return Center(
                    child: EmptyState(
                      icon: Icons.error_outline,
                      title: 'Something went wrong',
                      subtitle: '${snapshot.error}',
                    ),
                  );
                }

                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return Center(
                    child: EmptyState(icon: Icons.sports_cricket, title: 'No $selectedTab matches'),
                  );
                }

                final matches = snapshot.data!.docs;

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: matches.length,
                  itemBuilder: (context, index) {
                    final matchData = matches[index].data() as Map<String, dynamic>;
                    final matchId = matches[index].id;
                    return FadeSlideIn(
                      delay: Duration(milliseconds: 40 * (index % 8)),
                      child: _buildMatchCard(matchData, matchId, isAdmin),
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

  Widget _buildTabButton(String tab, String label, IconData icon) {
    final isSelected = selectedTab == tab;
    return GestureDetector(
      onTap: () => setState(() => selectedTab = tab),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? CricTheme.primary : CricTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(CricTheme.radiusSm),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? Colors.white : CricTheme.textMuted, size: 19),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : CricTheme.textMuted,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamAvatar(String teamName, bool isWinner) {
    final logoUrl = _teamLogos[teamName] ?? '';
    if (logoUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 22,
        backgroundColor: CricTheme.surfaceMuted,
        backgroundImage: NetworkImage(logoUrl),
        onBackgroundImageError: (_, __) {},
      );
    }
    return InitialAvatar(
      text: teamName,
      radius: 22,
      gradient: isWinner
          ? const LinearGradient(colors: [CricTheme.completedGreen, CricTheme.accentDeep])
          : CricTheme.brandGradient,
    );
  }

  Widget _buildMatchCard(Map<String, dynamic> matchData, String matchId, bool isAdmin) {
    final team1 = matchData['team1']?.toString() ?? 'Team 1';
    final team2 = matchData['team2']?.toString() ?? 'Team 2';
    final team1Score = matchData['team1Score']?.toString() ?? '0/0';
    final team2Score = matchData['team2Score']?.toString() ?? '0/0';
    final venue = matchData['venue']?.toString() ?? 'TBD';
    final matchTime = matchData['matchTime']?.toString() ?? '';
    final status = matchData['status']?.toString() ?? 'upcoming';
    final winner = matchData['winner']?.toString() ?? '';
    final result = matchData['result']?.toString() ?? '';

    String dateStr = 'TBD';
    if (matchData['matchDate'] != null) {
      if (matchData['matchDate'] is Timestamp) {
        final date = (matchData['matchDate'] as Timestamp).toDate();
        dateStr = '${date.day}/${date.month}/${date.year}';
      } else {
        dateStr = matchData['matchDate'].toString();
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: AppCard(
        onTap: () {
          if (isAdmin && status == 'upcoming') {
            Navigator.push(
              context,
              appRoute(MatchSetupScreen(matchId: matchId, team1: team1, team2: team2)),
            );
          } else {
            Navigator.push(
              context,
              appRoute(LiveScoreScreen(matchId: matchId, matchData: matchData)),
            );
          }
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusPill(
                  label: status.toUpperCase(),
                  color: CricTheme.statusColor(status),
                  icon: status == 'live' ? Icons.circle : Icons.schedule,
                ),
                const Spacer(),
                Text('$dateStr • $matchTime', style: CricTheme.labelMuted),
              ],
            ),
            const SizedBox(height: 16),
            if (status == 'completed' && result.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CricTheme.completedGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                  border: Border.all(color: CricTheme.completedGreen.withValues(alpha: 0.25)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.emoji_events, color: CricTheme.gold, size: 26),
                    const SizedBox(height: 6),
                    Text(
                      result,
                      style: const TextStyle(
                        color: CricTheme.completedGreen,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: _buildTeamColumn(team1, team1Score, winner == team1)),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Text('VS', style: TextStyle(color: CricTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
                Expanded(child: _buildTeamColumn(team2, team2Score, winner == team2)),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on, size: 14, color: CricTheme.textMuted),
                const SizedBox(width: 6),
                Expanded(child: Text(venue, style: CricTheme.labelMuted)),
                if (isAdmin)
                  InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () async {
                      bool? confirm = await showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(CricTheme.radiusMd)),
                          title: const Text('Delete Match'),
                          content: const Text('Are you sure?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                            TextButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: const Text('Delete', style: TextStyle(color: CricTheme.wicketRed)),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        await FirebaseFirestore.instance.collection('matches').doc(matchId).delete();
                      }
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(Icons.delete_outline, color: CricTheme.wicketRed, size: 20),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamColumn(String team, String score, bool isWinner) {
    return Column(
      children: [
        _buildTeamAvatar(team, isWinner),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isWinner) ...[
              const Icon(Icons.emoji_events, color: CricTheme.gold, size: 14),
              const SizedBox(width: 4),
            ],
            Flexible(
              child: Text(
                team,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: isWinner ? CricTheme.completedGreen : CricTheme.textPrimary,
                ),
              ),
            ),
          ],
        ),
        if (score.isNotEmpty && score != '0/0') ...[
          const SizedBox(height: 4),
          Text(score, style: const TextStyle(color: CricTheme.accentBlue, fontWeight: FontWeight.w700, fontSize: 14)),
        ],
      ],
    );
  }
}
