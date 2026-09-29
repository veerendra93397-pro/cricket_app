import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'leaderboard_screen.dart';
import 'user_live_match_screen.dart';

class TournamentDetailsScreen extends StatefulWidget {
  final String tournamentId;
  final Map<String, dynamic> tournamentData;

  const TournamentDetailsScreen({
    super.key,
    required this.tournamentId,
    required this.tournamentData,
  });

  @override
  State<TournamentDetailsScreen> createState() => _TournamentDetailsScreenState();
}

class _TournamentDetailsScreenState extends State<TournamentDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String name = widget.tournamentData['name'] ?? 'Tournament';
    final String stage = widget.tournamentData['stage'] ?? 'group';

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(        elevation: 0,
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00A550),
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: "POINTS"),
            Tab(text: "MATCHES"),
            Tab(text: "MOST RUNS"),
            Tab(text: "MOST WICKETS"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPointsTableTab(),
          _buildMatchesTab(stage),
          _buildLeaderboardTab('runs'),
          _buildLeaderboardTab('wickets'),
        ],
      ),
    );
  }

  Widget _buildPointsTableTab() {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('tournaments').doc(widget.tournamentId).snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final data = snapshot.data!.data() as Map<String, dynamic>;
        final pointsTable = data['pointsTable'] as Map<String, dynamic>? ?? {};

        List<MapEntry<String, dynamic>> sortedTeams = pointsTable.entries.toList();
        sortedTeams.sort((a, b) {
          int pointsA = a.value['points'] ?? 0;
          int pointsB = b.value['points'] ?? 0;
          if (pointsB != pointsA) return pointsB.compareTo(pointsA);
          double nrrA = (a.value['nrr'] ?? 0.0).toDouble();
          double nrrB = (b.value['nrr'] ?? 0.0).toDouble();
          return nrrB.compareTo(nrrA);
        });

        return ListView(
          padding: const EdgeInsets.all(15),
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 30),
                  Expanded(flex: 3, child: Text("TEAM", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                  Expanded(child: Text("P", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                  Expanded(child: Text("W", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                  Expanded(child: Text("L", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                  Expanded(child: Text("NRR", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                  Expanded(child: Text("PTS", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700, fontSize: 12))),
                ],
              ),
            ),
            const SizedBox(height: 10),
            ...sortedTeams.asMap().entries.map((entry) {
              int position = entry.key + 1;
              String teamName = entry.value.key;
              Map<String, dynamic> stats = entry.value.value as Map<String, dynamic>;
              int played = stats['played'] ?? 0;
              int won = stats['won'] ?? 0;
              int lost = stats['lost'] ?? 0;
              double nrr = (stats['nrr'] ?? 0.0).toDouble();
              int points = stats['points'] ?? 0;

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [BoxShadow(color: Colors.grey.shade200, blurRadius: 3, offset: const Offset(0, 1))],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 30,
                      child: Text(
                        "$position",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: position <= 4 ? const Color(0xFF00A550) : Colors.grey.shade700,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: Colors.blue.shade100,
                            child: Text(teamName.isNotEmpty ? teamName[0].toUpperCase() : 'T', style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                          const SizedBox(width: 8),
                          Flexible(child: Text(teamName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis)),
                        ],
                      ),
                    ),
                    Expanded(child: Text("$played", textAlign: TextAlign.center)),
                    Expanded(child: Text("$won", textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF00A550)))),
                    Expanded(child: Text("$lost", textAlign: TextAlign.center, style: const TextStyle(color: Colors.red))),
                    Expanded(child: Text(nrr.toStringAsFixed(2), textAlign: TextAlign.center, style: TextStyle(color: nrr >= 0 ? const Color(0xFF00A550) : Colors.red, fontWeight: FontWeight.bold, fontSize: 12))),
                    Expanded(child: Text("$points", textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F3D3E)))),
                  ],
                ),
              );
            }),
          ],
        );
      },
    );
  }

  Widget _buildMatchesTab(String stage) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('matches')
          .where('tournamentId', isEqualTo: widget.tournamentId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final matches = snapshot.data!.docs;

        Map<String, List<DocumentSnapshot>> groupedMatches = {
          'group': [],
          'playoffs': [],
          'final': [],
        };

        for (var match in matches) {
          final matchData = match.data() as Map<String, dynamic>;
          final matchStage = matchData['stage'] ?? 'group';
          
          if (matchStage == 'final') {
            groupedMatches['final']!.add(match);
          } else if (matchStage == 'playoffs') {
            groupedMatches['playoffs']!.add(match);
          } else {
            groupedMatches['group']!.add(match);
          }
        }

        return ListView(
          padding: const EdgeInsets.all(15),
          children: [
            if (groupedMatches['group']!.isNotEmpty) ...[
              _buildStageHeader("GROUP STAGE", Colors.orange),
              const SizedBox(height: 10),
              ...groupedMatches['group']!.map((doc) => _buildMatchCard(doc)),
              const SizedBox(height: 20),
            ],
            if (groupedMatches['playoffs']!.isNotEmpty) ...[
              _buildStageHeader("PLAYOFFS / SEMI-FINALS", Colors.purple),
              const SizedBox(height: 10),
              ...groupedMatches['playoffs']!.map((doc) => _buildMatchCard(doc)),
              const SizedBox(height: 20),
            ],
            if (groupedMatches['final']!.isNotEmpty) ...[
              _buildStageHeader("FINAL", Colors.amber.shade700),
              const SizedBox(height: 10),
              ...groupedMatches['final']!.map((doc) => _buildMatchCard(doc)),
              const SizedBox(height: 20),
            ],
            if (matches.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: Text("No matches yet", style: TextStyle(color: Colors.grey)),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildStageHeader(String title, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        title,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
      ),
    );
  }

  Widget _buildMatchCard(DocumentSnapshot doc) {
    final matchData = doc.data() as Map<String, dynamic>;
    final team1 = matchData['team1'] ?? 'Team 1';
    final team2 = matchData['team2'] ?? 'Team 2';
    final status = matchData['status'] ?? 'upcoming';
    final venue = matchData['venue'] ?? '';
    final team1Score = matchData['team1Score'] ?? '0/0';
    final team2Score = matchData['team2Score'] ?? '';
    final result = matchData['result'] ?? '';

    Color statusColor;
    String statusText;
    IconData statusIcon;

    switch (status) {
      case 'live':
        statusColor = Colors.red;
        statusText = 'LIVE';
        statusIcon = Icons.play_circle;
        break;
      case 'completed':
        statusColor = Colors.green;
        statusText = 'COMPLETED';
        statusIcon = Icons.check_circle;
        break;
      default:
        statusColor = Colors.orange;
        statusText = 'UPCOMING';
        statusIcon = Icons.schedule;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => UserLiveMatchScreen(
                matchId: doc.id,
                matchData: matchData,
              ),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(statusIcon, color: statusColor, size: 16),
                  const SizedBox(width: 5),
                  Text(statusText, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11)),
                  const Spacer(),
                  if (venue.isNotEmpty && venue != 'TBD')
                    Text(venue, style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(team1.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        if (team1Score.toString() != '0/0')
                          Text(team1Score.toString(), style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ),
                  const Text("VS", style: TextStyle(color: Colors.grey, fontSize: 12)),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(team2.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        if (team2Score.toString().isNotEmpty && team2Score.toString() != '0/0')
                          Text(team2Score.toString(), style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
              if (result.toString().isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    result.toString(),
                    style: TextStyle(color: Colors.green.shade800, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLeaderboardTab(String type) {
    return LeaderboardScreen(
      tournamentId: widget.tournamentId,
      type: type,
    );
  }
}