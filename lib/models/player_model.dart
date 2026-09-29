class PlayerModel {
  final String uid;
  final String playerName;
  final String email;
  final int age;
  final int jerseyNumber;
  final String role;
  final String teamName;

  PlayerModel({
    required this.uid,
    required this.playerName,
    required this.email,
    required this.age,
    required this.jerseyNumber,
    required this.role,
    required this.teamName,
  });

  factory PlayerModel.fromFirestore(Map<String, dynamic> data, String uid) {
    return PlayerModel(
      uid: uid,
      // Handles both 'playerName' and 'playername' from Firestore
      playerName: data['playerName'] ?? data['playername'] ?? 'N/A',
      email: data['email'] ?? 'N/A',
      age: data['age'] ?? 0,
      jerseyNumber: data['jerseyNumber'] ?? 0,
      role: data['role'] ?? 'N/A',
      // Handles both 'teamName' and 'teamname' from Firestore
      teamName: data['teamName'] ?? data['teamname'] ?? 'N/A',
    );
  }
}