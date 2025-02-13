import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> init() async {
    await _messaging.requestPermission();
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print("New Notification: ${message.notification?.title}");
    });
  }

  void sendNotification(String stockSymbol) {
    // Implement logic to check if rating is above 98% and send notification
  }
}