import 'package:get/get.dart';
import 'package:parichay/navigation/routes_constant.dart';

class SplashScreenController extends GetxController{
  String title = "WeNews";

  @override
  void onInit() {
    // TODO: implement onInit
    super.onInit();
    navigate();
  }

  void navigate()async
  {
    Future.delayed(Duration(seconds: 2));
    Get.offNamed(RoutesConstant.loginPage);
  }
}