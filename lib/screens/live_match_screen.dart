import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class LiveMatchScreen extends StatelessWidget {
  final String matchId;
  final Map<String, dynamic> matchData;

  const LiveMatchScreen({
    super.key,
    required this.matchId,
    required this.matchData,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(        title: const Text(
          'LIVE MATCH',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('matches')
            .doc(matchId)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data!.data() as Map<String, dynamic>;
          final team1 = data['team1'] ?? 'Team 1';
          final team2 = data['team2'] ?? 'Team 2';
          final score = data['team1Score'] ?? '0/0';
          final overs = data['team1Overs'] ?? '0.0';
          final target = data['target'] ?? 0;

          return SingleChildScrollView(
            child: Column(
              children: [
                // Score Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                team1.toString().toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$score ($overs ov)',
                                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              Text(
                                'CRR: ${_calculateCRR(data)}',
                                style: TextStyle(
                                  color: const Color(0xFF00C853),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE53935),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'LIVE',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                team2.toString().toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                              if (target > 0)
                                Text(
                                  'Target: $target',
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Batsmen Card
                _buildBatsmenCard(data),
                const SizedBox(height: 12),
                // Bowler Card
                _buildBowlerCard(data),
                const SizedBox(height: 12),
                // Recent Balls
                _buildRecentBalls(data),
              ],
            ),
          );
        },
      ),
    );
  }

  String _calculateCRR(Map<String, dynamic> data) {
    int runs = data['team1Runs'] ?? 0;
    String oversStr = data['team1Overs']?.toString() ?? '0.0';
    List<String> parts = oversStr.split('.');
    int overs = int.tryParse(parts[0]) ?? 0;
    int balls = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    double totalOvers = overs + (balls / 6);
    if (totalOvers == 0) return '0.00';
    return (runs / totalOvers).toStringAsFixed(2);
  }

  Widget _buildBatsmenCard(Map<String, dynamic> data) {
    List<dynamic> batsmen = data['currentBatsmen'] ?? [];
    if (batsmen.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1B2838),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF1a5f5f).withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'BATSMEN',
            style: TextStyle(
              color: const Color(0xFF00C853),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...batsmen.map((bat) {
            final b = bat as Map<String, dynamic>;
            final isOnStrike = b['isOnStrike'] == true;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  if (isOnStrike)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C853),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        '*',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  if (isOnStrike) const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      b['name']?.toString() ?? '',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '${b['runs'] ?? 0} (${b['balls'] ?? 0})',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildBowlerCard(Map<String, dynamic> data) {
    final bowler = data['currentBowler'] as Map<String, dynamic>?;
    if (bowler == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1B2838),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF1a5f5f).withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'BOWLER',
            style: TextStyle(
              color: const Color(0xFF00C853),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                bowler['name']?.toString() ?? '',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${bowler['overs'] ?? '0.0'}-${bowler['maidens'] ?? 0}-${bowler['runs'] ?? 0}-${bowler['wickets'] ?? 0}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentBalls(Map<String, dynamic> data) {
    List<dynamic> balls = data['recentBalls'] ?? [];
    if (balls.isEmpty) return const SizedBox.shrink();

    final displayBalls = balls.length > 12 ? balls.sublist(balls.length - 12) : balls;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1B2838),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF1a5f5f).withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'RECENT BALLS',
            style: TextStyle(
              color: const Color(0xFF00C853),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: displayBalls.map((ball) {
              String ballStr = ball.toString();
              Color bgColor;

              if (ballStr == '4') {
                bgColor = const Color(0xFF00C853);
              } else if (ballStr == '6') {
                bgColor = const Color(0xFF6a1b9a);
              } else if (ballStr.toUpperCase() == 'W') {
                bgColor = const Color(0xFFF44336);
              } else if (ballStr == 'WD' || ballStr == 'NB') {
                bgColor = const Color(0xFFFF9800);
              } else {
                bgColor = const Color(0xFF78909C);
              }

              return Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  ballStr,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}