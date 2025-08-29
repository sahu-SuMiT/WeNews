import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:get/get.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';
import 'package:parichay/features/splash_page/splash_screen_controller.dart';

class SplashScreenView extends GetView<SplashScreenController> {
  @override
  Widget build(BuildContext context) {
    // TODO: implement build
    return Scaffold(
      body: Center(
        child: Container(
          height: 200,
          child: Column(
            children: [
              Center(
                child: Text(
                  controller.title,
                  style: TextStyle(
                    color: Colors.orangeAccent,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
        LoadingAnimationWidget.inkDrop(
        color: Colors.orangeAccent,
        size: 200,)
            ],
          ),
        ),
      ),
    );
  }
}
