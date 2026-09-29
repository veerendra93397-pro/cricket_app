import 'package:flutter/material.dart';

class PlayerDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> playerData;
  final String playerId;

  const PlayerDetailsScreen({super.key, required this.playerData, required this.playerId});

  @override
  Widget build(BuildContext context) {
    final name = playerData['playerName'] ?? playerData['playername'] ?? 'Unknown Player';
    final email = playerData['email'] ?? 'N/A';
    final age = playerData['age'] ?? 0;
    final role = playerData['role'] ?? 'N/A';
    final team = playerData['teamName'] ?? playerData['teamname'] ?? 'N/A';
    final jersey = playerData['jerseyNumber'] ?? playerData['jerseynumber'] ?? 0;

    return Scaffold(
      appBar: AppBar(        title: const Text("Player Profile"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 20),
            CircleAvatar(
              radius: 60,
              child: Text(
                name[0].toUpperCase(),
                style: const TextStyle(fontSize: 50, color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 20),
            Text(name, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
            Text(email, style: TextStyle(fontSize: 16, color: Colors.grey[600])),
            const SizedBox(height: 30),
            
            _buildInfoCard(Icons.sports_cricket, "Role", role, Colors.orange),
            const SizedBox(height: 15),
            _buildInfoCard(Icons.groups, "Team", team, Colors.purple),
            const SizedBox(height: 15),
            _buildInfoCard(Icons.sports_esports, "Jersey Number", "#$jersey", Colors.blue),
            const SizedBox(height: 15),
            _buildInfoCard(Icons.cake, "Age", "$age years", Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(IconData icon, String label, String value, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 30),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                const SizedBox(height: 5),
                Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}