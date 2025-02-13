import 'package:web_socket_channel/io.dart';

class StockWebSocket {
  final String apiKey = "cuk6nh1r01qgs4829bh0cuk6nh1r01qgs4829bhg";
  late IOWebSocketChannel channel;

  void connect() {
    channel = IOWebSocketChannel.connect("wss://ws.finnhub.io?token=$apiKey");
  }

  void subscribe(String stockSymbol) {
    channel.sink.add('{"type":"subscribe","symbol":"$stockSymbol"}');
  }

  void unsubscribe(String stockSymbol) {
    channel.sink.add('{"type":"unsubscribe","symbol":"$stockSymbol"}');
  }

  void close() {
    channel.sink.close();
  }
}