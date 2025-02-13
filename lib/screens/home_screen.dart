import 'package:flutter/material.dart';
import '../services/stock_api.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> stocks = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchStocks();
  }

  Future<void> fetchStocks() async {
    try {
      final data = await StockAPI.fetchTopStocks();
      setState(() {
        stocks = data;
        isLoading = false;
      });
    } catch (e) {
      print("Error fetching stocks: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Top Stocks")),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: fetchStocks,
              child: ListView.builder(
                itemCount: stocks.length,
                itemBuilder: (context, index) {
                  final stock = stocks[index];
                  return ListTile(
                    title: Text(stock["symbol"]),
                    subtitle: Text("Rating: ${stock["rating"]}%"),
                    onTap: () {
                      // Navigate to stock detail page
                    },
                  );
                },
              ),
            ),
    );
  }
}