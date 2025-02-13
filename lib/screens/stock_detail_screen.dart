import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/stock.dart';
import '../providers/stock_provider.dart';
import '../widgets/stock_chart.dart';
import '../widgets/news_list.dart';

class StockDetailScreen extends StatelessWidget {
  final Stock stock;

  const StockDetailScreen({Key? key, required this.stock}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final stockProvider = Provider.of<StockProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(stock.symbol),
        actions: [
          IconButton(
            icon: Icon(stock.isFavorite ? Icons.star : Icons.star_border),
            onPressed: () {
              stockProvider.toggleFavorite(stock);
            },
          ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stock Price and Change %
            Text(
              "\$${stock.currentPrice.toStringAsFixed(2)}",
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            Text(
              "${stock.priceChangePercentage.toStringAsFixed(2)}%",
              style: TextStyle(
                fontSize: 18,
                color: stock.priceChangePercentage >= 0 ? Colors.green : Colors.red,
              ),
            ),

            SizedBox(height: 20),

            // Interactive Chart
            StockChart(stockSymbol: stock.symbol),

            SizedBox(height: 20),

            // Latest Stock News
            Text("Latest News", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Expanded(child: NewsList(stockSymbol: stock.symbol)),
          ],
        ),
      ),
    );
  }
}