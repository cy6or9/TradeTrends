import 'dart:convert';
import 'package:http/http.dart' as http;

class StockAPI {
  static const String apiKey = "cuk6nh1r01qgs4829bh0cuk6nh1r01qgs4829bhg";
  static const String baseUrl = "https://finnhub.io/api/v1";

  static Future<List<Map<String, dynamic>>> fetchTopStocks() async {
    final url = Uri.parse("$baseUrl/stock/recommendation?token=$apiKey");
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data
          .where((stock) => stock["rating"] >= 75)
          .map((stock) => stock as Map<String, dynamic>)
          .toList();
    } else {
      throw Exception("Failed to load stock data");
    }
  }
}