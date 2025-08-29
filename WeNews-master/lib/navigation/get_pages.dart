import 'package:get/get.dart';
import 'package:parichay/features/home_page/home_page_bindings.dart';
import 'package:parichay/features/home_page/home_page_view.dart';
import 'package:parichay/features/login_page/login_page_bindings.dart';
import 'package:parichay/features/login_page/login_page_view.dart';
import 'package:parichay/features/signup_page/signup_page_bindings.dart';
import 'package:parichay/features/signup_page/signup_page_view.dart';
import 'package:parichay/features/splash_page/splash_screen_bindings.dart';
import 'package:parichay/features/splash_page/splash_screen_view.dart';
import 'package:parichay/navigation/routes_constant.dart';

List<GetPage> getPages = [
  GetPage(
    name: RoutesConstant.splashPage,
    page: () => SplashScreenView(),
    binding: SplashScreenBindings(),
    transition: Transition.fadeIn,
    transitionDuration: Duration(seconds: 1),
  ),
  GetPage(
    name: RoutesConstant.loginPage,
    page: () => LoginPageView(),
    binding: LoginPageBindings(),
    transition: Transition.fadeIn,
    transitionDuration: Duration(seconds: 1),
  ),
  GetPage(
    name: RoutesConstant.homePage,
    page: () => HomePageView(),
    binding: HomePageBindings(),
    transition: Transition.fadeIn,
    transitionDuration: Duration(seconds: 1),
  ),
  GetPage(
    name: RoutesConstant.signUpPage,
    page: () => SignUpPageView(),
    binding: SignUpPageBindings(),
    transition: Transition.fadeIn,
    transitionDuration: Duration(seconds: 1),
  ),
];
