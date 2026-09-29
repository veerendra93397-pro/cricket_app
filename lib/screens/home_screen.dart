import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'my_profile_screen.dart';
import 'auth_screen.dart';
import 'teams_screen.dart';
import 'matches_screen.dart';
import 'players_screen.dart';
import 'live_score_screen.dart';
import 'user_live_match_screen.dart';
import 'tournaments_screen.dart';
import '../utils/admin_helper.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? playerData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlayerData();
  }

  Future<void> _loadPlayerData() async {
    try {
      String uid = FirebaseAuth.instance.currentUser!.uid;
      DocumentSnapshot doc =
          await FirebaseFirestore.instance.collection('players').doc(uid).get();

      if (mounted) {
        setState(() {
          playerData = doc.data() as Map<String, dynamic>?;
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error: $e");
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _refreshData() async {
    await _loadPlayerData();
  }

  void _navigateToScreen(Widget screen) {
    Navigator.push(context, appRoute(screen));
  }

  Future<void> _logout() async {
    await FirebaseAuth.instance.signOut();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const AuthScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        backgroundColor: CricTheme.scaffold,
        body: const Center(
          child: CircularProgressIndicator(color: CricTheme.accent),
        ),
      );
    }

    final bool isAdmin = AdminHelper.isAdmin();
    final playerName = playerData?['playerName'] ?? 'Player';
    final userEmail =
        playerData?['email'] ?? FirebaseAuth.instance.currentUser?.email ?? '';
    final initial = playerName.toString().isNotEmpty
        ? playerName.toString()[0].toUpperCase()
        : 'P';

    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(
        title: const Text('BTG CRICKET'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: CricTheme.surface,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 60, 20, 24),
              decoration: const BoxDecoration(gradient: CricTheme.headerGradient),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InitialAvatar(text: initial, radius: 32),
                  const SizedBox(height: 14),
                  Text(
                    playerName.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(userEmail,
                      style: const TextStyle(color: CricTheme.textOnDarkMuted, fontSize: 13)),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _buildDrawerItem(Icons.groups, 'Teams', () => _navigateToScreen(const TeamsScreen())),
                  _buildDrawerItem(Icons.people, 'Players', () => _navigateToScreen(const PlayersScreen())),
                  _buildDrawerItem(Icons.sports_cricket, 'Matches', () => _navigateToScreen(const MatchesScreen())),
                  _buildDrawerItem(Icons.emoji_events, 'Tournaments', () => _navigateToScreen(TournamentsScreen())),
                  _buildDrawerItem(Icons.person, 'My Profile', () => _navigateToScreen(const MyProfileScreen())),
                  const Divider(height: 24, indent: 20, endIndent: 20),
                  _buildDrawerItem(Icons.logout, 'Logout', _logout, isDestructive: true),
                ],
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        color: CricTheme.accent,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeSlideIn(
                delay: const Duration(milliseconds: 0),
                child: _buildLiveMatchSection(isAdmin),
              ),
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: _buildQuickActions(isAdmin),
              ),
              FadeSlideIn(
                delay: const Duration(milliseconds: 160),
                child: _buildUpcomingMatches(),
              ),
              FadeSlideIn(
                delay: const Duration(milliseconds: 240),
                child: _buildRecentResults(),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title, VoidCallback onTap,
      {bool isDestructive = false}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Icon(icon, color: isDestructive ? CricTheme.wicketRed : CricTheme.primary),
      title: Text(title,
          style: TextStyle(
              color: isDestructive ? CricTheme.wicketRed : CricTheme.textPrimary,
              fontWeight: FontWeight.w600)),
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
    );
  }

  Widget _buildLiveMatchSection(bool isAdmin) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Live Match', padding: EdgeInsets.only(bottom: 12)),
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('matches')
                .where('status', isEqualTo: 'live')
                .limit(1)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const LoadingState();
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: CricTheme.surfaceMuted,
                    borderRadius: BorderRadius.circular(CricTheme.radiusLg),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.sports_cricket, size: 44, color: CricTheme.textMuted),
                      const SizedBox(height: 10),
                      Text('No live match right now',
                          style: CricTheme.labelMuted.copyWith(fontSize: 14)),
                    ],
                  ),
                );
              }

              final doc = snapshot.data!.docs.first;
              final matchData = doc.data() as Map<String, dynamic>;
              final team1 = matchData['team1']?.toString() ?? 'Team 1';
              final team2 = matchData['team2']?.toString() ?? 'Team 2';
              final score1 = matchData['team1Score']?.toString() ?? '0/0';
              final score2 = matchData['team2Score']?.toString() ?? '';
              final overs = matchData['team1Overs']?.toString() ?? '0.0';

              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: CricTheme.liveCardGradient,
                  borderRadius: BorderRadius.circular(CricTheme.radiusLg),
                  boxShadow: [
                    BoxShadow(
                      color: CricTheme.liveRed.withValues(alpha: 0.28),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('LIVE MATCH',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                letterSpacing: 0.5)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(CricTheme.radiusPill)),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const PulsingDot(color: CricTheme.liveRed, size: 8),
                              const SizedBox(width: 6),
                              const Text('LIVE',
                                  style: TextStyle(
                                      color: CricTheme.liveRed,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 11)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    Row(
                      children: [
                        Expanded(child: _buildTeamCol(team1, score1, team1.isNotEmpty ? team1[0] : 'T')),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 10),
                          child: Text('VS',
                              style: TextStyle(
                                  color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w700)),
                        ),
                        Expanded(
                          child: _buildTeamCol(
                              team2, score2.isNotEmpty ? score2 : 'Yet to bat', team2.isNotEmpty ? team2[0] : 'T',
                              isRight: true),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('($overs ov)', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 16),
                    PressableScale(
                      onTap: () {
                        if (isAdmin) {
                          _navigateToScreen(LiveScoreScreen(matchId: doc.id, matchData: matchData));
                        } else {
                          _navigateToScreen(UserLiveMatchScreen(matchId: doc.id, matchData: matchData));
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(CricTheme.radiusPill),
                        ),
                        child: Text(
                          isAdmin ? 'UPDATE SCORE' : 'VIEW LIVE SCORE',
                          style: const TextStyle(
                              color: CricTheme.liveRed, fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTeamCol(String name, String score, String initial, {bool isRight = false}) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.18),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(initial.toUpperCase(),
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
          ),
        ),
        const SizedBox(height: 8),
        Text(name,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
            maxLines: 2,
            overflow: TextOverflow.ellipsis),
        const SizedBox(height: 4),
        Text(score,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800)),
      ],
    );
  }

  Widget _buildQuickActions(bool isAdmin) {
    final actions = [
      {'icon': Icons.groups, 'label': 'Teams', 'gradient': CricTheme.brandGradient, 'screen': const TeamsScreen()},
      {
        'icon': Icons.people,
        'label': 'Players',
        'gradient': const LinearGradient(colors: [Color(0xFF7C4DFF), Color(0xFF5E35B1)]),
        'screen': const PlayersScreen()
      },
      {
        'icon': Icons.sports_cricket,
        'label': 'Matches',
        'gradient': const LinearGradient(colors: [Color(0xFF2979FF), Color(0xFF1565C0)]),
        'screen': const MatchesScreen()
      },
      {
        'icon': Icons.live_tv,
        'label': 'Live Score',
        'gradient': const LinearGradient(colors: [Color(0xFFFF9100), Color(0xFFE65100)]),
        'screen': const MatchesScreen()
      },
      {
        'icon': Icons.emoji_events,
        'label': 'Tournaments',
        'gradient': CricTheme.goldGradient,
        'screen': TournamentsScreen()
      },
      {
        'icon': Icons.person,
        'label': 'Profile',
        'gradient': const LinearGradient(colors: [Color(0xFF26A69A), Color(0xFF00695C)]),
        'screen': const MyProfileScreen()
      },
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Quick Actions', padding: EdgeInsets.only(bottom: 12)),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.05,
            children: actions.map((action) {
              return PressableScale(
                onTap: () => _navigateToScreen(action['screen'] as Widget),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: action['gradient'] as Gradient,
                    borderRadius: BorderRadius.circular(CricTheme.radiusMd),
                    boxShadow: CricTheme.softShadow,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(action['icon'] as IconData, color: Colors.white, size: 28),
                      const SizedBox(height: 8),
                      Text(action['label'] as String,
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingMatches() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Upcoming Matches', padding: EdgeInsets.only(bottom: 12)),
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('matches')
                .where('status', isEqualTo: 'upcoming')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) return const LoadingState();
              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return const EmptyState(icon: Icons.event_busy, title: 'No upcoming matches');
              }

              return Column(
                children: snapshot.data!.docs.map((doc) {
                  final data = doc.data() as Map<String, dynamic>;
                  final team1 = data['team1']?.toString() ?? 'Team 1';
                  final team2 = data['team2']?.toString() ?? 'Team 2';
                  final venue = data['venue']?.toString() ?? 'TBD';

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppCard(
                      onTap: () => _navigateToScreen(LiveScoreScreen(matchId: doc.id, matchData: data)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          StatusPill(label: 'UPCOMING', color: CricTheme.upcomingOrange, icon: Icons.schedule),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Row(children: [
                                  InitialAvatar(text: team1, radius: 18),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(team1,
                                        style: CricTheme.headingSmall,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                  ),
                                ]),
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8),
                                child: Text('VS', style: CricTheme.labelMuted),
                              ),
                              Expanded(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Expanded(
                                      child: Text(team2,
                                          textAlign: TextAlign.right,
                                          style: CricTheme.headingSmall,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis),
                                    ),
                                    const SizedBox(width: 10),
                                    InitialAvatar(text: team2, radius: 18),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(children: [
                            const Icon(Icons.location_on, size: 14, color: CricTheme.textMuted),
                            const SizedBox(width: 5),
                            Text(venue, style: CricTheme.labelMuted),
                          ]),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecentResults() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Recent Results', padding: EdgeInsets.only(bottom: 12)),
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('matches')
                .where('status', isEqualTo: 'completed')
                .limit(5)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) return const LoadingState();
              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return const EmptyState(icon: Icons.emoji_events_outlined, title: 'No completed matches yet');
              }

              return Column(
                children: snapshot.data!.docs.map((doc) {
                  final data = doc.data() as Map<String, dynamic>;
                  final team1 = data['team1'] ?? 'Team 1';
                  final team2 = data['team2'] ?? 'Team 2';
                  final score1 = data['team1Score'] ?? '0/0';
                  final result = data['result'] ?? '';

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppCard(
                      onTap: () => _navigateToScreen(UserLiveMatchScreen(matchId: doc.id, matchData: data)),
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: CricTheme.completedGreen.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                            ),
                            child: Icon(Icons.check_circle, color: CricTheme.completedGreen, size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('$team1 vs $team2',
                                    style: CricTheme.headingSmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 4),
                                Text('Score: $score1', style: CricTheme.labelMuted),
                                if (result.toString().isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(result.toString(),
                                        style: const TextStyle(
                                            color: CricTheme.completedGreen,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600)),
                                  ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: CricTheme.textMuted),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
