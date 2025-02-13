import 'package:hive/hive.dart';
import '../models/stock.dart';

class OfflineStorage {
  static late Box _stockBox;

  static Future<void> init() async {
    Hive.initFlutter();
    _stockBox = await Hive.openBox('stocks');
  }

  static void saveStockData(List<Stock> stocks) {
    _stockBox.put('cachedStocks', stocks.map((s) => s.toJson()).toList());
  }

  static List<Stock> getStockData() {
    var cachedData = _stockBox.get('cachedStocks', defaultValue: []);
    return cachedData.map<Stock>((json) => Stock.fromJson(json)).toList();
  }
}