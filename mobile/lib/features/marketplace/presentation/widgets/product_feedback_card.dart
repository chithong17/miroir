import 'package:flutter/material.dart';

import '../../../../core/app/app_session_scope.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/miroir_button.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../data/catalog_models.dart';
import '../../data/catalog_service.dart';

class ProductFeedbackCard extends StatefulWidget {
  const ProductFeedbackCard({
    super.key,
    required this.product,
    this.context = 'product',
  });

  final CatalogProduct product;
  final String context;

  @override
  State<ProductFeedbackCard> createState() => _ProductFeedbackCardState();
}

class _ProductFeedbackCardState extends State<ProductFeedbackCard> {
  final _service = CatalogService();
  final _commentController = TextEditingController();
  int _rating = 5;
  String _fitFeedback = 'not_sure';
  String _message = '';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      session.openLogin();
      return;
    }

    setState(() {
      _isSubmitting = true;
      _message = '';
    });

    try {
      await _service.submitProductFeedback(
        token: session.authToken,
        productId: widget.product.id,
        rating: _rating,
        fitFeedback: _fitFeedback,
        comment: _commentController.text,
        context: widget.context,
      );
      setState(() => _message = 'Thanks, your feedback was saved.');
    } catch (error) {
      setState(() => _message = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return SectionCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Review this product',
              style:
                  textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Row(
            children: List.generate(5, (index) {
              final value = index + 1;
              return GestureDetector(
                onTap: () => setState(() => _rating = value),
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Icon(
                    value <= _rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: AppColors.ink,
                    size: 28,
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: _fitFeedback,
            decoration: InputDecoration(
              labelText: 'Fit feedback',
              filled: true,
              fillColor: AppColors.canvas,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            items: const [
              DropdownMenuItem(
                  value: 'true_to_size', child: Text('True to size')),
              DropdownMenuItem(value: 'runs_small', child: Text('Runs small')),
              DropdownMenuItem(value: 'runs_large', child: Text('Runs large')),
              DropdownMenuItem(value: 'not_sure', child: Text('Not sure')),
            ],
            onChanged: (value) =>
                setState(() => _fitFeedback = value ?? 'not_sure'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Comment',
              filled: true,
              fillColor: AppColors.canvas,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          if (_message.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(_message,
                style: textTheme.bodySmall?.copyWith(color: AppColors.muted)),
          ],
          const SizedBox(height: 14),
          MiroirButton(
            label: _isSubmitting ? 'Submitting...' : 'Submit feedback',
            onPressed: _isSubmitting ? null : _submit,
            icon: Icons.rate_review_outlined,
            isSecondary: true,
          ),
        ],
      ),
    );
  }
}
