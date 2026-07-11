import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../data/payment_models.dart';
import '../data/payment_service.dart';

Future<void> showPremiumPaywall(
  BuildContext context, {
  required AppSessionController session,
  String reason = 'Unlock premium MIROIR features.',
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => PremiumPaywallSheet(session: session, reason: reason),
  );
}

class PremiumPaywallSheet extends StatefulWidget {
  const PremiumPaywallSheet({
    super.key,
    required this.session,
    required this.reason,
  });

  final AppSessionController session;
  final String reason;

  @override
  State<PremiumPaywallSheet> createState() => _PremiumPaywallSheetState();
}

class _PremiumPaywallSheetState extends State<PremiumPaywallSheet> {
  final _service = PaymentService();
  PaymentPlan? _plan;
  String _orderCode = '';
  String _message = '';
  bool _isLoading = true;
  bool _isCreating = false;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    setState(() {
      _isLoading = true;
      _message = '';
    });
    try {
      final result = await _service.getPlans();
      _plan = result.userPremiumPlan;
      if (_plan == null) {
        _message = 'No user premium plan is available yet.';
      }
    } catch (error) {
      _message = ApiError.from(error).message;
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _startPayment() async {
    final plan = _plan;
    final token = widget.session.authToken;
    if (plan == null || token.isEmpty) return;

    setState(() {
      _isCreating = true;
      _message = '';
    });

    try {
      final result = await _service.createPayment(
        token: token,
        planCode: plan.code,
      );
      _orderCode = result.orderCode;
      if (result.checkoutUrl.isEmpty) {
        _message = 'Payment checkout URL was not returned.';
      } else {
        final uri = Uri.parse(result.checkoutUrl);
        final opened =
            await launchUrl(uri, mode: LaunchMode.externalApplication);
        if (!opened) {
          _message = 'Could not open payment checkout.';
        }
      }
    } catch (error) {
      _message = ApiError.from(error).message;
    } finally {
      if (mounted) {
        setState(() => _isCreating = false);
      }
    }
  }

  Future<void> _refreshAfterPayment() async {
    setState(() {
      _isRefreshing = true;
      _message = '';
    });

    try {
      if (_orderCode.isNotEmpty) {
        await _service.getStatus(
          token: widget.session.authToken,
          orderCode: _orderCode,
        );
      } else {
        await _service.getMyPaymentState(widget.session.authToken);
      }
      await widget.session.refreshCurrentUser();
      if (widget.session.isPremium) {
        if (mounted) Navigator.of(context).pop();
      } else {
        _message =
            'Payment is not active yet. Please wait a moment and refresh again.';
      }
    } catch (error) {
      _message = ApiError.from(error).message;
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final plan = _plan;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(
          left: 14,
          right: 14,
          bottom: 14 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: GlassSurface(
          radius: 32,
          blurSigma: 18,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Upgrade to Premium',
                        style: textTheme.headlineSmall),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(widget.reason, style: textTheme.bodyLarge),
              const SizedBox(height: 16),
              if (_isLoading)
                const Center(child: CircularProgressIndicator())
              else if (plan != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(plan.name.isEmpty ? 'User Premium' : plan.name,
                          style: textTheme.titleLarge),
                      const SizedBox(height: 6),
                      Text(
                          '${_formatMoney(plan.price)} / ${plan.durationDays} days',
                          style: textTheme.headlineSmall),
                      const SizedBox(height: 10),
                      for (final feature in plan.features.take(4))
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded,
                                  size: 18, color: Color(0xFF31B56A)),
                              const SizedBox(width: 8),
                              Expanded(child: Text(feature)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                MiroirButton(
                  label: _isCreating ? 'Opening Payment...' : 'Pay with PayOS',
                  onPressed: _isCreating ? null : _startPayment,
                  icon: Icons.payment_rounded,
                ),
                const SizedBox(height: 10),
                MiroirButton(
                  label: _isRefreshing
                      ? 'Refreshing...'
                      : 'I have completed payment',
                  onPressed: _isRefreshing ? null : _refreshAfterPayment,
                  icon: Icons.refresh_rounded,
                  isSecondary: true,
                ),
              ],
              if (_message.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(_message, style: const TextStyle(color: Colors.redAccent)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

String _formatMoney(double value) {
  final rounded = value.round().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < rounded.length; i++) {
    final reverseIndex = rounded.length - i;
    buffer.write(rounded[i]);
    if (reverseIndex > 1 && reverseIndex % 3 == 1) buffer.write('.');
  }
  return '${buffer.toString()} VND';
}
