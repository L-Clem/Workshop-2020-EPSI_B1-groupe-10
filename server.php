<?php
    require("require/bdd.php");
    session_start();

    function selectGame($bdd) {
        $selectGame = $bdd->query("SELECT SQL_NO_CACHE nameKey FROM games ORDER BY RAND() LIMIT 1");
        $selectGame = $selectGame->fetch();
        $nameKey = $selectGame["nameKey"];

        return $nameKey;
    }

    if(isset($_GET["gameover"]) && !isset($_GET["gamenext"]) && !isset($_GET["gamestart"])) { // Le joueur vient de perdre, on enregistre son score et le redirige vers la page gameover.html
        
        if(isset($_GET["gameover"]) && isset($_SESSION["score"]) && is_numeric($_SESSION["score"])) {
            if(isset($_SESSION["id"]) && !empty($_SESSION["id"]) && is_numeric($_SESSION["id"])) {
                $insertScore = $bdd->prepare("INSERT INTO scores (idUser, score, time, state) VALUES (?,?,?,?)");
                $insertScore->execute(array($_SESSION["id"], $_SESSION["score"], time(), 1));

                $selectBestScore = $bdd->prepare("SELECT bestScore FROM users WHERE id = ? AND state = ?");
                $selectBestScore->execute(array($_SESSION["id"], 1));
                $bestScoreUser = $selectBestScore->fetch();

                if($_SESSION["score"] > $bestScoreUser["bestScore"]) {
                    $updateBestScore = $bdd->prepare("UPDATE users SET bestScore = ? WHERE id = ?");
                    $updateBestScore->execute(array($_SESSION["score"], $_SESSION["id"]));

                    header("Location: gameover.php?gameover&newbestscore");
                } else {
                    header("Location: gameover.php?gameover");
                }
            } else {
                header("Location: gameover.php?gameover");
            }
        }
        
    } elseif(isset($_GET["gamenext"]) && !isset($_GET["gameover"]) && !isset($_GET["gamestart"])) { // Le jouer vient de gagner un mini jeu, on lui ajoute 1 point et le redirige vers le prochain jeu
        
        $_SESSION["difficulte"]++;
        $_SESSION["score"]++;
        header("Location: games/".selectGame($bdd)."/?difficulte=".$_SESSION["difficulte"]);
    
    } elseif(isset($_GET["gamestart"]) && !isset($_GET["gameover"]) && !isset($_GET["gamenext"])) { // Démarrage d'un nouveau jeu
        
        $_SESSION["difficulte"] = 1;
        $_SESSION["score"] = 0;
        header("Location: games/".selectGame($bdd)."/?difficulte=".$_SESSION["difficulte"]);
    
    } else {
        
        $_SESSION["difficulte"] = 1;
        $_SESSION["score"] = 0;
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
        <style>
            html {
                background-color: #000000;
                background-image: none;
                overflow: hidden;
            }
        </style>
    </head>

    <body>
        <div class="loading">
            <img src="assets/img/logo_violet.png" class="loading-logo">
            <br>
            <span>PREPARATION DU PROCHAIN JEU</span>
            <!-- <span>BRAVO !<br>plus tard tu seras envoye vers un autre jeu</span> -->
            <!-- <a href="index.php" class="btn btn-small" style="display:inline-block;">
                QUITTER
            </a> -->
            <br>
            <img src="assets/img/loading.gif" class="loading-gif">            
        </div>
    </body>
</html>