import 'package:get/get.dart';
import 'package:parichay/features/signup_page/signup_page_controller.dart';

class SignUpPageBindings extends Bindings {
  @override
  void dependencies() {
   Get.lazyPut(()=>SignUpPageController());
  }

}