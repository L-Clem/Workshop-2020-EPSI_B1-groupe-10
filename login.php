<?php
session_start();

if(isset($_SESSION["id"]) && !empty($_SESSION["id"]) && is_numeric($_SESSION["id"])) {
    header("Location: index.php");
}

?><!DOCTYPE html>
<html>
    <head>
        <title>Arcade Park</title>
        <meta name="description" content="...">
        <link rel="stylesheet" href="assets/css/style.css" type="text/css">
        <script type="text/javascript" src="assets/js/script.js"></script>
        <meta name="keywords" content="...">
        <meta http-equiv="Content-Language" content="fr">          
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/png" sizes="228x228" href="assets/img/logo_violet.png">
    </head>

    <body>
        <a href="index.php" class="link-top-right">
            <span>ACCUEIL</span>
            <img src="assets/img/home_icon.png">
        </a>

        <div class="logo-small"></div>

        <form action="#" method="post" id="formLogin">
            <label for="pseudo">Pseudo :</label>
            <input type="text" name="pseudo" id="pseudo" />

            <br><br><br>

            <label for="password">Mot de passe :</label>
            <input type="password" name="password" id="password" />

            <br><br>

            <button type="submit" id="submitBtn">CONNEXION</button>
            <button onclick="document.location.href='signin.php';" style="border:0;">INSCRIPTION</button>
        </form>

        <footer>
            &copy; Arcade Park 2020
        </footer>

        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script>
            $("#formLogin").submit(function() {
                $("#submitBtn").html("<img src=\"assets/img/loading.gif\" width=\"40px\">");
                var pseudo = $("#pseudo").val();
                var password = $("#password").val();

                $.post(
                    "php/login.php", {
                        pseudo:pseudo,
                        password:password
                    }, function (html) {
                        if(html == "success") {
                            document.location.href = "index.php";
                        } else {
                            $(".error").remove();
                            $("#submitBtn").html("CONNEXION");
                            $("#formLogin").prepend("<div class=\"error\">"+html+"</div>");
                        }
                    }
                );

                return false;
            });
        </script>
    </body>
</html>