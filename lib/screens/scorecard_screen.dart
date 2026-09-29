import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ScorecardScreen extends StatefulWidget {
  final String matchId;
  final Map<String, dynamic> matchData;

  const ScorecardScreen({
    super.key,
    required this.matchId,
    required this.matchData,
  });

  @override
  State<ScorecardScreen> createState() => _ScorecardScreenState();
}

class _ScorecardScreenState extends State<ScorecardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _tabCount = 1;

  @override
  void initState() {
    super.initState();
    _tabCount = _getTabCount(widget.matchData);
    _tabController = TabController(length: _tabCount, vsync: this);
  }

  int _getTabCount(Map<String, dynamic> data) {
    bool has2nd = (data['secondInningsTeam']?.toString().isNotEmpty ?? false) ||
        (data['inningsNumber'] == 2);
    return has2nd ? 2 : 1;
  }

  String _tab1Label(Map<String, dynamic> data) {
    String team = data['firstInningsTeam']?.toString() ?? '';
    if (team.isEmpty) team = data['team1']?.toString() ?? '1st Inn';
    return '$team (1st Inn)';
  }

  String _tab2Label(Map<String, dynamic> data) {
    String team = data['secondInningsTeam']?.toString() ?? '';
    if (team.isEmpty) team = data['team1']?.toString() ?? '2nd Inn';
    return '$team (2nd Inn)';
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('matches')
          .doc(widget.matchId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || !snapshot.data!.exists) {
          return Scaffold(
            appBar: AppBar(              title: const Text('Scorecard'),
            ),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final data = snapshot.data!.data() as Map<String, dynamic>;

        // Rebuild tab controller if innings count changed
        int newTabCount = _getTabCount(data);
        if (newTabCount != _tabCount) {
          _tabCount = newTabCount;
          _tabController.dispose();
          _tabController = TabController(length: _tabCount, vsync: this);
        }

        // ── Resolve innings data ───────────────────────────────────────
        final String team1 = data['team1'] ?? 'Team 1';
        final String team2 = data['team2'] ?? 'Team 2';
        final String status = data['status'] ?? 'upcoming';
        final String result = data['result'] ?? '';
        final String tossWinner = data['tossWinner'] ?? '';
        final String tossDecision = data['tossDecision'] ?? '';
        final int innings = data['inningsNumber'] ?? 1;

        // 1st innings
        String inn1Team = data['firstInningsTeam']?.toString() ?? team2;
        String inn1Score = data['firstInningsScore']?.toString() ?? '';
        String inn1Overs = data['firstInningsOvers']?.toString() ?? '0.0';
        List<dynamic> inn1Batsmen = data['firstInningsBatsmen'] ?? [];
        List<dynamic> inn1Bowlers = data['firstInningsBowlers'] ?? [];
        String inn1BowlingTeam = '';

        // If still in 1st innings, use live data
        if (innings == 1) {
          inn1Team = team1;
          inn1Score = data['team1Score'] ?? '0/0';
          inn1Overs = data['team1Overs'] ?? '0.0';
          inn1Batsmen = data['currentBatsmen'] ?? [];
          inn1Bowlers = _mergeBowlers(
              data['bowlersHistory'] ?? [], data['currentBowler']);
          inn1BowlingTeam = team2;
        } else {
          // 2nd innings started — 1st innings data should be stored
          if (inn1Score.isEmpty) inn1Score = data['team2Score'] ?? '0/0';
          inn1BowlingTeam = team1; // batting team in 1st was opposite
        }

        // 2nd innings
        String inn2Team = data['secondInningsTeam']?.toString() ?? '';
        String inn2Score = data['secondInningsScore']?.toString() ?? '';
        String inn2Overs = data['secondInningsOvers']?.toString() ?? '0.0';
        List<dynamic> inn2Batsmen = data['secondInningsBatsmen'] ?? [];
        List<dynamic> inn2Bowlers = data['secondInningsBowlers'] ?? [];

        if (innings == 2) {
          // Live 2nd innings — override with current live data
          inn2Team = data['team1'] ?? '';
          inn2Score = data['team1Score'] ?? '0/0';
          inn2Overs = data['team1Overs'] ?? '0.0';
          inn2Batsmen = data['currentBatsmen'] ?? [];
          inn2Bowlers = _mergeBowlers(
              data['bowlersHistory'] ?? [], data['currentBowler']);
        }

        final String inn2BowlingTeam = inn1Team; // 2nd inn bowlers = 1st inn batting team

        return Scaffold(
          backgroundColor: const Color(0xFFF4F4F4),
          appBar: AppBar(            elevation: 0,
            title: const Text('Scorecard',
                style: TextStyle(fontWeight: FontWeight.w500)),
            bottom: PreferredSize(
              preferredSize: Size.fromHeight(result.isNotEmpty ? 128 : 88),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Match header in appbar
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Column(
                      children: [
                        Text(
                          '$team1 vs $team2',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15),
                        ),
                        if (innings == 2 || status == 'completed') ...[
                          const SizedBox(height: 2),
                          Text(
                            status == 'completed'
                                ? inn2Score.isNotEmpty
                                    ? '$inn2Score (${inn2Overs} / ${data['totalOvers'] ?? '?'} Overs)'
                                    : '$inn1Score ($inn1Overs Ov)'
                                : '$inn2Score ($inn2Overs / ${data['totalOvers'] ?? '?'} Overs)',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 20),
                          ),
                        ] else ...[
                          const SizedBox(height: 2),
                          Text(
                            '$inn1Score ($inn1Overs / ${data['totalOvers'] ?? '?'} Overs)',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 20),
                          ),
                        ],
                        if (tossWinner.isNotEmpty)
                          Text(
                            '$tossWinner won the toss and elected to $tossDecision',
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 11),
                          ),
                        if (result.isNotEmpty)
                          Container(
                            margin: const EdgeInsets.only(top: 6, bottom: 2),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.amber.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.amber),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.emoji_events,
                                    color: Colors.amber, size: 15),
                                const SizedBox(width: 6),
                                Text(result,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Tab bar
                  if (_tabCount > 1)
                    TabBar(
                      controller: _tabController,
                      indicatorColor: const Color(0xFF00C853),
                      indicatorWeight: 3,
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.white60,
                      labelStyle: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 12),
                      tabs: [
                        Tab(text: _tab1Label(data)),
                        Tab(text: _tab2Label(data)),
                      ],
                    )
                  else
                    const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          body: _tabCount > 1
              ? TabBarView(
                  controller: _tabController,
                  children: [
                    _InningsView(
                      battingTeam: inn1Team,
                      bowlingTeam: inn1BowlingTeam.isEmpty ? team2 : inn1BowlingTeam,
                      score: inn1Score.isEmpty ? '0/0' : inn1Score,
                      overs: inn1Overs,
                      batsmen: inn1Batsmen,
                      bowlers: inn1Bowlers,
                      isLive: innings == 1 && status == 'live',
                      status: status,
                    ),
                    _InningsView(
                      battingTeam: inn2Team.isEmpty ? team1 : inn2Team,
                      bowlingTeam: inn2BowlingTeam.isEmpty ? team2 : inn2BowlingTeam,
                      score: inn2Score.isEmpty ? '0/0' : inn2Score,
                      overs: inn2Overs,
                      batsmen: inn2Batsmen,
                      bowlers: inn2Bowlers,
                      isLive: innings == 2 && status == 'live',
                      status: status,
                    ),
                  ],
                )
              : _InningsView(
                  battingTeam: inn1Team,
                  bowlingTeam: inn1BowlingTeam.isEmpty ? team2 : inn1BowlingTeam,
                  score: inn1Score.isEmpty ? '0/0' : inn1Score,
                  overs: inn1Overs,
                  batsmen: inn1Batsmen,
                  bowlers: inn1Bowlers,
                  isLive: innings == 1 && status == 'live',
                  status: status,
                ),
        );
      },
    );
  }

  List<Map<String, dynamic>> _mergeBowlers(
      List<dynamic> history, dynamic current) {
    final Map<String, Map<String, dynamic>> merged = {};
    for (final b in history) {
      final map = b as Map<String, dynamic>;
      final name = map['name']?.toString() ?? '';
      if (name.isNotEmpty) merged[name] = Map<String, dynamic>.from(map);
    }
    if (current != null && current is Map) {
      final name = current['name']?.toString() ?? '';
      if (name.isNotEmpty) merged[name] = Map<String, dynamic>.from(current as Map<String, dynamic>);
    }
    return merged.values.toList();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single innings view
// ─────────────────────────────────────────────────────────────────────────────
class _InningsView extends StatelessWidget {
  final String battingTeam;
  final String bowlingTeam;
  final String score;
  final String overs;
  final List<dynamic> batsmen;
  final List<dynamic> bowlers;
  final bool isLive;
  final String status;

  const _InningsView({
    required this.battingTeam,
    required this.bowlingTeam,
    required this.score,
    required this.overs,
    required this.batsmen,
    required this.bowlers,
    required this.isLive,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── BATTING section ─────────────────────────────────────
          _sectionHeader('$battingTeam - Batting', const Color(0xFF0F3D3E)),
          const SizedBox(height: 8),
          _buildBattingTable(),
          const SizedBox(height: 16),

          // ── BOWLING section ─────────────────────────────────────
          _sectionHeader('$bowlingTeam - Bowling', const Color(0xFF0F3D3E)),
          const SizedBox(height: 8),
          _buildBowlingTable(),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, Color color) {
    return Row(
      children: [
        Container(width: 4, height: 20, color: color),
        const SizedBox(width: 8),
        Text(title,
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: color)),
      ],
    );
  }

  Widget _buildBattingTable() {
    // Calculate extras = score - sum of batsmen runs
    int totalRuns = 0;
    try {
      totalRuns = int.parse(score.split('/')[0]);
    } catch (_) {}
    int batsmenRuns =
        batsmen.fold(0, (s, b) => s + ((b as Map)['runs'] as int? ?? 0));
    int extras = (totalRuns - batsmenRuns).clamp(0, 9999);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Header
          _tableHeader(['BATSMAN', 'R', 'B', '4s', '6s', 'SR'],
              flexes: [4, 1, 1, 1, 1, 1]),
          // Rows
          if (batsmen.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                  child: Text('No batting data yet',
                      style: TextStyle(color: Colors.grey))),
            )
          else
            ...batsmen.asMap().entries.map((e) {
              final b = e.value as Map<String, dynamic>;
              bool onStrike = (b['isOnStrike'] == true) &&
                  isLive &&
                  status != 'completed';
              int r = b['runs'] ?? 0;
              int bl = b['balls'] ?? 0;
              int f = b['fours'] ?? 0;
              int s = b['sixes'] ?? 0;
              String sr =
                  bl > 0 ? ((r / bl) * 100).toStringAsFixed(2) : '0.00';
              String name = b['name']?.toString() ?? 'Unknown';
              bool isEven = e.key % 2 == 0;

              return Container(
                decoration: BoxDecoration(
                  color: onStrike
                      ? const Color(0xFFE8F5E9)
                      : isEven
                          ? Colors.white
                          : const Color(0xFFFAFAFA),
                  border: Border(
                      bottom: BorderSide(color: Colors.grey.shade100)),
                ),
                padding: const EdgeInsets.symmetric(
                    vertical: 12, horizontal: 12),
                child: Row(
                  children: [
                    Expanded(
                      flex: 4,
                      child: Row(
                        children: [
                          Flexible(
                            child: Text(name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13),
                                overflow: TextOverflow.ellipsis),
                          ),
                          if (onStrike)
                            const Text(' *',
                                style: TextStyle(
                                    color: Color(0xFF00A550),
                                    fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    _cell('$r', bold: true),
                    _cell('$bl'),
                    _cell('$f'),
                    _cell('$s'),
                    _cell(sr, small: true),
                  ],
                ),
              );
            }),
          // Extras row
          if (extras > 0)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              decoration: BoxDecoration(
                  border: Border(
                      bottom: BorderSide(color: Colors.grey.shade200))),
              child: Row(
                children: [
                  const Expanded(
                      flex: 4,
                      child: Text('Extras',
                          style: TextStyle(
                              fontStyle: FontStyle.italic,
                              color: Colors.grey,
                              fontSize: 12))),
                  Expanded(
                    flex: 5,
                    child: Text('$extras (w $extras)',
                        style: const TextStyle(
                            fontSize: 12, color: Colors.grey)),
                  ),
                ],
              ),
            ),
          // Total row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 12),
            decoration:
                BoxDecoration(color: Colors.grey.shade50),
            child: Row(
              children: [
                const Expanded(
                  flex: 4,
                  child: Text('TOTAL',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 13)),
                ),
                Expanded(
                  flex: 5,
                  child: Text(
                    '$score ($overs Ov)',
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Color(0xFF0F3D3E)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBowlingTable() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          _tableHeader(['BOWLER', 'O', 'M', 'R', 'W', 'ECO'],
              flexes: [4, 1, 1, 1, 1, 1]),
          if (bowlers.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                  child: Text('No bowling data yet',
                      style: TextStyle(color: Colors.grey))),
            )
          else
            ...bowlers.asMap().entries.map((e) {
              final b = e.value as Map<String, dynamic>;
              String name = b['name']?.toString() ?? 'Unknown';
              String ov = b['overs']?.toString() ?? '0.0';
              int m = b['maidens'] ?? 0;
              int r = b['runs'] ?? 0;
              int w = b['wickets'] ?? 0;
              String eco = _economy(b);
              bool isEven = e.key % 2 == 0;

              return Container(
                padding: const EdgeInsets.symmetric(
                    vertical: 12, horizontal: 12),
                decoration: BoxDecoration(
                  color: isEven ? Colors.white : const Color(0xFFFAFAFA),
                  border: Border(
                      bottom: BorderSide(color: Colors.grey.shade100)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      flex: 4,
                      child: Text(name,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 13),
                          overflow: TextOverflow.ellipsis),
                    ),
                    _cell(ov),
                    _cell('$m'),
                    _cell('$r'),
                    _cell('$w', bold: true),
                    _cell(eco, small: true),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _tableHeader(List<String> cols, {required List<int> flexes}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF0F3D3E),
        borderRadius: BorderRadius.only(
            topLeft: Radius.circular(7), topRight: Radius.circular(7)),
      ),
      child: Row(
        children: cols.asMap().entries.map((e) {
          bool isFirst = e.key == 0;
          return Expanded(
            flex: flexes[e.key],
            child: Text(
              e.value,
              textAlign: isFirst ? TextAlign.left : TextAlign.center,
              style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.bold),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _cell(String text,
      {bool bold = false, bool small = false}) {
    return Expanded(
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: small ? 11 : 13,
          fontWeight: bold ? FontWeight.bold : FontWeight.normal,
          color: const Color(0xFF0F3D3E),
        ),
      ),
    );
  }

  String _economy(Map<String, dynamic> b) {
    String oversStr = b['overs']?.toString() ?? '0.0';
    int runs = b['runs'] ?? 0;
    List<String> parts = oversStr.split('.');
    int ov = int.tryParse(parts[0]) ?? 0;
    int bl = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    int total = (ov * 6) + bl;
    if (total == 0) return '0.00';
    return (runs / (total / 6)).toStringAsFixed(2);
  }
}