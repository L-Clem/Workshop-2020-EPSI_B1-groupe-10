<?php
session_start();

if(isset($_GET["gameover"]) && isset($_SESSION["score"]) && is_numeric($_SESSION["score"])) {
    $score = $_SESSION["score"];
} else {
    header("Location: index.php");
}
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
        <div class="logo-small"></div>

        <div class="gameover">
            <span>GAME</span><br><span>OVER</span>
            <br>
            <?php
            if(isset($_GET["newbestscore"])) {
                ?>
                <span style="font-family: 'Arcade_r', Arial, Helvetica, sans-serif;border-radius:10px;padding:14px 10px;background-color: rgb(200,50,50, 0.9);font-size: 1rem;">vous avez battu votre record 💪</span>
                <br>
                <?php
            }
            ?>
            <span style="border-radius:10px;padding:14px 10px;background-color: rgb(230,156,72, 0.9);font-size: 2rem;"><?php if($score < 2) { echo $score." POINT"; } else { echo $score." POINTS"; } ?></span>
        </div>

        <div class="menu">
            <a href="server.php?gamestart" class="btn btn-big">
                REJOUER
            </a>
            <a href="index.php" class="btn btn-small">
                QUITTER
            </a>
        </div>

        <footer>
            &copy; Arcade Park 2020
        </footer>
    </body>
</html>