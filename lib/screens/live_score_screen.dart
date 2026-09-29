import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/admin_helper.dart';
import 'admin_score_update_screen.dart';
import 'live_scoring_interface.dart';
import 'scorecard_screen.dart';

class LiveScoreScreen extends StatefulWidget {
  final String matchId;
  final Map<String, dynamic> matchData;

  const LiveScoreScreen({
    super.key,
    required this.matchId,
    required this.matchData,
  });

  @override
  State<LiveScoreScreen> createState() => _LiveScoreScreenState();
}

class _LiveScoreScreenState extends State<LiveScoreScreen> {
  @override
  Widget build(BuildContext context) {
    final bool isAdmin = AdminHelper.isAdmin();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F5),
      appBar: AppBar(        elevation: 0,
        title: const Text("Live score", style: TextStyle(fontWeight: FontWeight.w500)),
        actions: [
          if (isAdmin)
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: Colors.white),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AdminScoreUpdateScreen(
                      matchId: widget.matchId,
                      matchData: widget.matchData,
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('matches')
            .doc(widget.matchId)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator(color: const Color(0xFF0F3D3E)));
          }
          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text("Match not found"));
          }

          final matchData = snapshot.data!.data() as Map<String, dynamic>;
          final status = matchData['status'] ?? 'upcoming';

          return SingleChildScrollView(
            child: Column(
              children: [
                _buildHeaderCard(status, matchData),
                _buildBallStrip(matchData),
                _buildBatsmenRow(matchData, status),
                _buildBowlerRow(matchData, status),
                _buildCommentaryFeed(matchData),
                _buildScorecardAccess(matchData, status),
              ],
            ),
          );
        },
      ),
    );
  }

  bool _isInProgress(String status) => status == 'live' || status == 'innings_break';

  // ── Cricbuzz-style gradient header ───────────────────────────────
  Widget _buildHeaderCard(String status, Map<String, dynamic> data) {
    bool inProgress = _isInProgress(status);
    bool isCompleted = status == 'completed';
    String t1Score = data['team1Score']?.toString() ?? '0/0';
    String t1Overs = data['team1Overs']?.toString() ?? '0.0';
    int t1Runs = data['team1Runs'] ?? 0;
    int totalBalls = _parseOversToBalls(t1Overs);
    String crr = totalBalls == 0 ? "0.00" : ((t1Runs / totalBalls) * 6).toStringAsFixed(2);
    int target = data['target'] ?? 0;
    int innings = data['inningsNumber'] ?? 1;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF0F3D3E), Color(0xFF1a5f5f)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  "${data['team1'] ?? 'Team 1'} vs ${data['team2'] ?? 'Team 2'}",
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (inProgress)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xFFE53935), borderRadius: BorderRadius.circular(10)),
                  child: Text(
                    status == 'innings_break' ? "BREAK" : "● LIVE",
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500),
                  ),
                )
              else if (isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                  child: const Text("RESULT", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (data['team1'] ?? 'Team 1').toString().toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(t1Score.split('/')[0],
                            style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w500)),
                        Text("/${t1Score.contains('/') ? t1Score.split('/')[1] : '0'}",
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    Text("($t1Overs ov)  CRR $crr",
                        style: const TextStyle(color: Color(0xFF9FE1CB), fontSize: 12)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    (data['team2'] ?? 'Team 2').toString().toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w400),
                  ),
                  Text(
                    innings == 1 ? "Yet to bat" : (isCompleted ? "" : "Target $target"),
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          if (isCompleted && (data['result']?.toString().isNotEmpty ?? false)) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.emoji_events, color: Color(0xFFFAC775), size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      data['result'].toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Horizontal scrollable ball strip (replaces the old static dots) ──
  Widget _buildBallStrip(Map<String, dynamic> data) {
    List<dynamic> balls = data['recentBalls'] ?? [];
    if (balls.isEmpty) return const SizedBox.shrink();
    final displayBalls = balls.length > 20 ? balls.sublist(balls.length - 20) : balls;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: SizedBox(
        height: 30,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: displayBalls.length,
          itemBuilder: (context, i) {
            String ball = displayBalls[i].toString();
            return Container(
              width: 28,
              height: 28,
              margin: const EdgeInsets.only(right: 6),
              decoration: BoxDecoration(color: _getBallColor(ball), shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Text(
                ball,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ── Maps a ball's display string to a chip color ─────────────────
  Color _getBallColor(String ball) {
    switch (ball) {
      case 'W':
        return Colors.red.shade600;
      case '4':
        return Colors.blue.shade600;
      case '6':
        return Colors.purple.shade600;
      case 'WD':
      case 'NB':
      case 'B':
      case 'LB':
        return Colors.orange.shade600;
      case '0':
        return Colors.grey.shade500;
      default:
        return Colors.green.shade600;
    }
  }

  // ── Batsmen cards with strike highlight ──────────────────────────
  Widget _buildBatsmenRow(Map<String, dynamic> data, String status) {
    if (status == 'completed') return const SizedBox.shrink();
    List<dynamic> batsmen = data['currentBatsmen'] ?? [];
    if (batsmen.isEmpty) return const SizedBox.shrink();

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Row(
        children: batsmen.map<Widget>((b) {
          final bat = b as Map<String, dynamic>;
          bool onStrike = bat['isOnStrike'] == true;
          return Expanded(
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: onStrike ? const Color(0xFFE8F5E9) : const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(8),
                border: onStrike ? Border.all(color: const Color(0xFF00A550), width: 1.5) : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          bat['name']?.toString() ?? '',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: onStrike ? const Color(0xFF085041) : const Color(0xFF78909C),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (onStrike)
                        const Padding(
                          padding: EdgeInsets.only(left: 3),
                          child: Text("●", style: TextStyle(color: Color(0xFF1D9E75), fontSize: 8)),
                        ),
                    ],
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text("${bat['runs'] ?? 0}",
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                      Text(" (${bat['balls'] ?? 0})",
                          style: TextStyle(fontSize: 11, color: const Color(0xFF78909C))),
                    ],
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildBowlerRow(Map<String, dynamic> data, String status) {
    if (status == 'completed') return const SizedBox.shrink();
    final bowlerData = data['currentBowler'];
    if (bowlerData == null || bowlerData is! Map || bowlerData.isEmpty) return const SizedBox.shrink();
    final bowler = bowlerData as Map<String, dynamic>;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          Icon(Icons.sports_baseball_outlined, size: 16, color: const Color(0xFF78909C)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(bowler['name']?.toString() ?? '',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
          Text(
            "${bowler['overs'] ?? '0.0'}-${bowler['maidens'] ?? 0}-${bowler['runs'] ?? 0}-${bowler['wickets'] ?? 0}",
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF78909C)),
          ),
        ],
      ),
    );
  }

  // ── Live commentary feed (replaces "coming soon" placeholder) ────
  Widget _buildCommentaryFeed(Map<String, dynamic> data) {
    List<dynamic> balls = data['recentBalls'] ?? [];
    if (balls.isEmpty) return const SizedBox.shrink();

    final recent = balls.length > 15 ? balls.sublist(balls.length - 15) : balls;
    final lines = recent.reversed.toList();

    return Container(
      margin: const EdgeInsets.fromLTRB(0, 8, 0, 0),
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Commentary",
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF78909C))),
          const SizedBox(height: 6),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 220),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: lines.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                String ball = lines[i].toString();
                String text = 'Ball played: $ball';
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(text, style: const TextStyle(fontSize: 13, height: 1.4)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScorecardAccess(Map<String, dynamic> data, String status) {
    final bool isAdmin = AdminHelper.isAdmin();
    final bool isCompleted = status == 'completed';
    final bool isLive = status == 'live';
    final bool isInningsBreak = status == 'innings_break';
    final bool hasStarted = isLive || isInningsBreak || isCompleted;

    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (hasStarted)
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ScorecardScreen(matchId: widget.matchId, matchData: data),
                    ),
                  );
                },
                icon: const Icon(Icons.menu_book_outlined, size: 18),
                label: const Text("Full scorecard"),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF0F3D3E),
                  side: BorderSide(color: const Color(0xFF0F3D3E)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          if (isAdmin && (isLive || isInningsBreak)) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => LiveScoringInterface(matchId: widget.matchId, matchData: data),
                    ),
                  ).then((_) {
                    if (mounted) setState(() {});
                  });
                },
                icon: const Icon(Icons.touch_app_outlined, size: 18),
                label: Text(isInningsBreak ? "Resume scoring" : "Open scoring panel"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F3D3E),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  int _parseOversToBalls(String oversStr) {
    if (oversStr.isEmpty) return 0;
    List<String> parts = oversStr.split('.');
    int overs = int.tryParse(parts[0]) ?? 0;
    int balls = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    return (overs * 6) + balls;
  }
}
