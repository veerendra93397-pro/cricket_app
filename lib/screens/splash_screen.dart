import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math';
import 'package:firebase_auth/firebase_auth.dart';
import 'auth_screen.dart';
import 'home_screen.dart';
import '../utils/cric_theme.dart';
import '../utils/app_widgets.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<double> _scale;
  final List<_Star> stars = [];

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 900),
      vsync: this,
    );

    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _scale = Tween<double>(begin: 0.85, end: 1.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    final rnd = Random();
    for (int i = 0; i < 26; i++) {
      stars.add(_Star(
        x: rnd.nextDouble(),
        y: rnd.nextDouble(),
        size: rnd.nextDouble() * 2 + 1,
        opacity: rnd.nextDouble() * 0.5 + 0.2,
      ));
    }

    _controller.forward();

    Timer(const Duration(milliseconds: 2200), () {
      if (!mounted) return;
      final user = FirebaseAuth.instance.currentUser;
      Navigator.pushReplacement(
        context,
        appRoute(user != null ? const HomeScreen() : const AuthScreen()),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: CricTheme.splashGradient),
        child: Stack(
          children: [
            Positioned(top: 24, left: 24, child: _stadiumLight()),
            Positioned(top: 24, right: 24, child: _stadiumLight()),
            ...stars.map((star) => Positioned(
                  left: star.x * size.width,
                  top: star.y * size.height,
                  child: Container(
                    width: star.size,
                    height: star.size,
                    decoration: BoxDecoration(
                      color: CricTheme.gold.withValues(alpha: star.opacity),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: CricTheme.gold.withValues(alpha: star.opacity * 0.5),
                          blurRadius: star.size * 2,
                        ),
                      ],
                    ),
                  ),
                )),
            Center(
              child: FadeTransition(
                opacity: _fade,
                child: ScaleTransition(
                  scale: _scale,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: CricTheme.goldGradient,
                          boxShadow: [
                            BoxShadow(
                              color: CricTheme.gold.withValues(alpha: 0.55),
                              blurRadius: 70,
                              spreadRadius: 18,
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                Positioned(
                                  top: 16,
                                  right: 36,
                                  child: Container(
                                    width: 26,
                                    height: 26,
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                                Transform.rotate(
                                  angle: -0.5,
                                  child: Container(
                                    width: 64,
                                    height: 13,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(7),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Text('BTG', style: CricTheme.splashTitle),
                            const SizedBox(height: 2),
                            const Text(
                              'CRICKET',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 46),
                      const SizedBox(
                        width: 30,
                        height: 30,
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(CricTheme.gold),
                          strokeWidth: 3,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Loading...',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 13,
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stadiumLight() {
    return Container(
      width: 54,
      height: 54,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.white.withValues(alpha: 0.85), blurRadius: 26, spreadRadius: 12),
          BoxShadow(color: CricTheme.primaryLight.withValues(alpha: 0.5), blurRadius: 44, spreadRadius: 20),
        ],
      ),
    );
  }
}

class _Star {
  final double x, y, size, opacity;
  _Star({required this.x, required this.y, required this.size, required this.opacity});
}
