import 'package:get/get.dart';
import 'package:parichay/features/splash_page/splash_screen_controller.dart';

class SplashScreenBindings extends Bindings{
  @override
  void dependencies() {
    Get.lazyPut(()=>SplashScreenController());
  }

}