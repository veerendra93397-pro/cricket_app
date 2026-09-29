import 'package:flutter/material.dart';
import 'cric_theme.dart';

/// ============================================================
/// Shared, reusable UI pieces used across every screen so the
/// app feels like one cohesive product instead of separate
/// screens stitched together.
/// ============================================================

/// ============================================================
/// Resolves the correct score for each team from a match document.
///
/// `live_scoring_interface.dart` swaps `team1`/`team2` at the innings
/// break so `team1` always means "currently batting", and stashes the
/// 1st innings score under `firstInningsScore` — but never updates
/// `team2Score` to match. Reading `team2Score` directly for a completed
/// or 2nd-innings match gives stale/empty data. This helper reads the
/// right field depending on match state so every screen shows both
/// scores consistently.
/// ============================================================
class MatchScores {
  final String team1;
  final String team1Score;
  final String team2;
  final String team2Score;

  const MatchScores({
    required this.team1,
    required this.team1Score,
    required this.team2,
    required this.team2Score,
  });

  factory MatchScores.fromMatchData(Map<String, dynamic> data) {
    final team1 = (data['team1'] ?? 'Team 1').toString();
    final team2 = (data['team2'] ?? 'Team 2').toString();
    final team1Score = (data['team1Score'] ?? '0/0').toString();
    final inningsNumber = data['inningsNumber'] ?? 1;
    final status = (data['status'] ?? '').toString();

    String team2Score;
    if (inningsNumber == 2 || status == 'completed') {
      // team2 is now the team that batted FIRST — its score lives in
      // firstInningsScore, not team2Score (which is stale after the swap).
      final firstInnings = data['firstInningsScore'];
      team2Score = (firstInnings ?? data['team2Score'] ?? '').toString();
    } else {
      team2Score = (data['team2Score'] ?? '').toString();
    }

    return MatchScores(team1: team1, team1Score: team1Score, team2: team2, team2Score: team2Score);
  }
}

/// Gradient header used behind app bars / hero sections.
class GradientHeader extends StatelessWidget {
  final Widget child;
  final double height;
  final EdgeInsetsGeometry padding;
  const GradientHeader({
    super.key,
    required this.child,
    this.height = 0,
    this.padding = const EdgeInsets.fromLTRB(20, 16, 20, 24),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: const BoxDecoration(
        gradient: CricTheme.headerGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(bottom: false, child: child),
    );
  }
}

/// Standard rounded, softly-shadowed card.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color ?? CricTheme.cardBg,
      borderRadius: BorderRadius.circular(CricTheme.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CricTheme.radiusMd),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(CricTheme.radiusMd),
            boxShadow: CricTheme.softShadow,
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Small pill-shaped status/label badge.
class StatusPill extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  const StatusPill({super.key, required this.label, required this.color, this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(CricTheme.radiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

/// Circular initials avatar with a brand gradient fallback.
class InitialAvatar extends StatelessWidget {
  final String text;
  final double radius;
  final String? imageUrl;
  final Gradient? gradient;
  const InitialAvatar({
    super.key,
    required this.text,
    this.radius = 22,
    this.imageUrl,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;
    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: hasImage ? null : (gradient ?? CricTheme.brandGradient),
        image: hasImage
            ? DecorationImage(image: NetworkImage(imageUrl!), fit: BoxFit.cover)
            : null,
      ),
      child: hasImage
          ? null
          : Center(
              child: Text(
                text.isNotEmpty ? text[0].toUpperCase() : '?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: radius * 0.75,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
    );
  }
}

/// Consistent empty-state placeholder.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  const EmptyState({super.key, required this.icon, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: CricTheme.surfaceMuted,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 34, color: CricTheme.textMuted),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: CricTheme.headingSmall.copyWith(color: CricTheme.textSecondary),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: CricTheme.labelMuted,
            ),
          ],
        ],
      ),
    );
  }
}

/// Consistent loading placeholder.
class LoadingState extends StatelessWidget {
  final String label;
  const LoadingState({super.key, this.label = 'Loading...'});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.6),
            ),
            const SizedBox(height: 12),
            Text(label, style: CricTheme.labelMuted),
          ],
        ),
      ),
    );
  }
}

/// Small section header used above list groups ("Upcoming Matches" etc.)
class SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;
  const SectionHeader({
    super.key,
    required this.title,
    this.trailing,
    this.padding = const EdgeInsets.fromLTRB(20, 22, 20, 12),
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: CricTheme.headingMedium),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

/// Reusable primary button with loading state built in.
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final Color? color;
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? CricTheme.accent,
          disabledBackgroundColor: (color ?? CricTheme.accent).withValues(alpha: 0.6),
        ),
        child: loading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
                  Text(label),
                ],
              ),
      ),
    );
  }
}

/// Staggered fade + slide-up entrance animation. Wrap any section in this
/// and give each one an increasing [delay] to make a screen feel like it
/// "arrives" instead of just appearing.
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  const FadeSlideIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 420),
  });

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: widget.duration);
  late final Animation<double> _fade = CurvedAnimation(parent: _c, curve: Curves.easeOut);
  late final Animation<Offset> _slide =
      Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(_fade);

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// A small breathing red dot + "LIVE" style pulse, used to mark anything
/// happening in real time so the UI reads as alive, not frozen.
class PulsingDot extends StatefulWidget {
  final Color color;
  final double size;
  const PulsingDot({super.key, this.color = Colors.white, this.size = 8});

  @override
  State<PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<PulsingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween<double>(begin: 1, end: 0.25).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)),
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
      ),
    );
  }
}

/// Wraps any tappable widget with a satisfying, subtle press-down scale so
/// taps feel responsive instead of static/dead.
class PressableScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  const PressableScale({super.key, required this.child, this.onTap});

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  double _scale = 1;

  void _set(double v) => setState(() => _scale = v);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => _set(0.96),
      onTapUp: (_) => _set(1),
      onTapCancel: () => _set(1),
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Fade+slide page route for smoother, less jarring navigation.
Route<T> appRoute<T>(Widget page) {
  return PageRouteBuilder<T>(
    transitionDuration: const Duration(milliseconds: 260),
    pageBuilder: (_, animation, __) => page,
    transitionsBuilder: (_, animation, __, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(begin: const Offset(0, 0.03), end: Offset.zero)
              .animate(curved),
          child: child,
        ),
      );
    },
  );
}
