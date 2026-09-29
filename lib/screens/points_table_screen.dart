import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class PointsTableScreen extends StatelessWidget {
  const PointsTableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CricTheme.scaffold,
      appBar: AppBar(title: const Text('POINTS TABLE', style: TextStyle(letterSpacing: 1))),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('tournaments').snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const LoadingState();
          }
          if (snapshot.data!.docs.isEmpty) {
            return const EmptyState(icon: Icons.leaderboard_outlined, title: 'No tournaments found');
          }

          final tournament = snapshot.data!.docs.first.data() as Map<String, dynamic>;
          final pointsTable = tournament['pointsTable'] as Map<String, dynamic>? ?? {};

          List<MapEntry<String, dynamic>> sortedTeams = pointsTable.entries.toList();
          sortedTeams.sort((a, b) {
            int pointsA = a.value['points'] ?? 0;
            int pointsB = b.value['points'] ?? 0;
            if (pointsB != pointsA) return pointsB.compareTo(pointsA);
            double nrrA = (a.value['nrr'] ?? 0.0).toDouble();
            double nrrB = (b.value['nrr'] ?? 0.0).toDouble();
            return nrrB.compareTo(nrrA);
          });

          if (sortedTeams.isEmpty) {
            return const EmptyState(icon: Icons.leaderboard_outlined, title: 'Standings not available yet');
          }

          return Column(
            children: [
              Container(
                margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: CricTheme.primaryDark,
                  borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                ),
                child: const Row(
                  children: [
                    SizedBox(width: 28),
                    Expanded(flex: 3, child: Text('Team', style: _headerStyle)),
                    Expanded(child: Text('M', textAlign: TextAlign.center, style: _headerStyle)),
                    Expanded(child: Text('W', textAlign: TextAlign.center, style: _headerStyle)),
                    Expanded(child: Text('L', textAlign: TextAlign.center, style: _headerStyle)),
                    Expanded(child: Text('NRR', textAlign: TextAlign.center, style: _headerStyle)),
                    Expanded(child: Text('Pts', textAlign: TextAlign.center, style: _headerStyle)),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  itemCount: sortedTeams.length,
                  itemBuilder: (context, index) {
                    final entry = sortedTeams[index];
                    final teamName = entry.key;
                    final stats = entry.value as Map<String, dynamic>;
                    final played = stats['played'] ?? 0;
                    final won = stats['won'] ?? 0;
                    final lost = stats['lost'] ?? 0;
                    final nrr = (stats['nrr'] ?? 0.0).toDouble();
                    final points = stats['points'] ?? 0;
                    final qualifying = index < 4;

                    return FadeSlideIn(
                      delay: Duration(milliseconds: 30 * (index % 10)),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: CricTheme.surface,
                          borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                          border: qualifying
                              ? Border(left: BorderSide(color: CricTheme.accent, width: 3))
                              : null,
                          boxShadow: CricTheme.softShadow,
                        ),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 28,
                              child: Text(
                                '${index + 1}',
                                style: TextStyle(
                                  color: qualifying ? CricTheme.accentDeep : CricTheme.textMuted,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            Expanded(
                              flex: 3,
                              child: Row(
                                children: [
                                  InitialAvatar(text: teamName, radius: 16),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      teamName,
                                      style: CricTheme.headingSmall,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(child: Text('$played', textAlign: TextAlign.center, style: CricTheme.bodyText)),
                            Expanded(
                              child: Text('$won',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: CricTheme.completedGreen, fontWeight: FontWeight.w600)),
                            ),
                            Expanded(
                              child: Text('$lost',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: CricTheme.wicketRed, fontWeight: FontWeight.w600)),
                            ),
                            Expanded(
                              child: Text(
                                nrr.toStringAsFixed(2),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: nrr >= 0 ? CricTheme.completedGreen : CricTheme.wicketRed,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Text('$points',
                                  textAlign: TextAlign.center,
                                  style: CricTheme.headingSmall.copyWith(fontSize: 15)),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                decoration: BoxDecoration(
                  color: CricTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(CricTheme.radiusSm),
                ),
                child: Text(
                  'Top 4 teams will qualify for the Semi Finals',
                  textAlign: TextAlign.center,
                  style: CricTheme.labelMuted,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

const TextStyle _headerStyle = TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w700);
