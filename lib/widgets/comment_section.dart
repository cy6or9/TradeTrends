import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class CommentSection extends StatefulWidget {
  final String stockSymbol;

  const CommentSection({Key? key, required this.stockSymbol}) : super(key: key);

  @override
  _CommentSectionState createState() => _CommentSectionState();
}

class _CommentSectionState extends State<CommentSection> {
  final TextEditingController _commentController = TextEditingController();

  void _postComment() async {
    if (_commentController.text.isNotEmpty) {
      await FirebaseFirestore.instance.collection('comments').add({
        'stockSymbol': widget.stockSymbol,
        'comment': _commentController.text,
        'timestamp': Timestamp.now(),
      });
      _commentController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _commentController,
          decoration: InputDecoration(labelText: "Write a comment..."),
        ),
        ElevatedButton(onPressed: _postComment, child: Text("Post")),

        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('comments')
                .where('stockSymbol', isEqualTo: widget.stockSymbol)
                .orderBy('timestamp', descending: true)
                .snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return CircularProgressIndicator();
              
              var comments = snapshot.data!.docs;
              return ListView.builder(
                itemCount: comments.length,
                itemBuilder: (context, index) {
                  var comment = comments[index]['comment'];
                  return ListTile(title: Text(comment));
                },
              );
            },
          ),
        ),
      ],
    );
  }
}