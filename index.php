<?php
session_start();
?>
<!DOCTYPE html>
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
        <div class="mascotte">
            <img src="assets/img/alien_x4.png">
        </div>

        <a href="classement.php" class="link-top-right">
            <span>CLASSEMENT</span>
            <img src="assets/img/classement_icon.png">
        </a>

        <?php
        if(isset($_SESSION["id"]) && !empty($_SESSION["id"]) && is_numeric($_SESSION["id"])) {
            ?>
            <a href="panel/" class="link-top-right" style="top:100px;">
                <span>AJOUTER UN JEU</span>
                <img src="assets/img/login_icon.png">
            </a>
            <a href="logout.php" class="link-top-right" style="top:170px;">
                <span>DECONNEXION</span>
                <img src="assets/img/login_icon.png">
            </a>
            <?php
        } else {
            ?>
            <a href="login.php" class="link-top-right" style="top:100px;">
                <span>MON ESPACE</span>
                <img src="assets/img/login_icon.png">
            </a>
            <?php
        }
        ?>
        

        <div class="logo-big"></div>

        <div class="menu">
            <a href="server.php?gamestart" class="btn btn-big" style="margin-top:30px;">
                JOUER
            </a>
        </div>

        <footer style="position:absolute;bottom:30px;">
            &copy; Arcade Park 2020
        </footer>

        <script>
        var audio = new Audio('assets/songs/jeu_0.wav');
        audio.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
		audio.volume=.5;
		audio.play();
        </script>
    </body>
</html>