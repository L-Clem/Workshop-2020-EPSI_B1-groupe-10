<?php
    require("require/bdd.php");
    session_start();

    $selectClassement = $bdd->query("SELECT id, pseudo, bestScore FROM users WHERE state = 1 ORDER BY bestScore DESC LIMIT 6");
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
        <a href="index.php" class="link-top-right">
            <span>ACCUEIL</span>
            <img src="assets/img/home_icon.png">
        </a>

        <div class="logo-small"></div>

        <div class="classement">
            <table>
                <tbody>
                    <?php
                    $i = 0;
                    while($scoreInfos = $selectClassement->fetch()) {
                        $i++;
                        if($i == 1) {
                            $podium = "gold";
                            $idGold = $scoreInfos["id"];
                        } elseif($i == 2) {
                            $podium = "argent";
                            $idArgent = $scoreInfos["id"];
                        } elseif($i == 3) {
                            $podium = "bronze";
                            $idBronze = $scoreInfos["id"];
                        } else {
                            $podium = "";
                        }
                        ?>
                        <tr>
                            <td class="id">#<?= $i ?></td>
                            <td class="pseudo"><?= $scoreInfos["pseudo"] ?></td>
                            <td class="score"><span class="<?= $podium ?>"><?= $scoreInfos["bestScore"] ?></span></td>
                        </tr>
                        <?php
                    }

                    if(isset($_SESSION["id"]) && !empty($_SESSION["id"]) && is_numeric($_SESSION["id"])) {
                        $selectClassementUser = $bdd->prepare("SELECT pseudo, bestScore FROM users WHERE state = 1 AND id = ?");
                        $selectClassementUser->execute(array($_SESSION["id"]));
                        if($selectClassementUser->rowCount() == 1) {
                            $scoreUserInfos = $selectClassementUser->fetch();

                            if($idGold == $_SESSION["id"]) {
                                $podium = "gold";
                            } elseif($idArgent == $_SESSION["id"]) {
                                $podium = "argent";
                            } elseif($idBronze == $_SESSION["id"]) {
                                $podium = "bronze";
                            } else {
                                $podium = "";
                            }

                            $selectPosUser = $bdd->query("SELECT id FROM users WHERE state = 1 ORDER BY bestScore DESC");
                            $ii = 0;
                            while($posUser = $selectPosUser->fetch()) {
                                $ii++;
                                if($posUser["id"] == $_SESSION["id"]) {
                                    break;
                                }
                            }

                            ?>
                            <tr>
                                <td style="border-top: 3px solid #fff;" class="id">#<?= $ii ?></td>
                                <td style="border-top: 3px solid #fff;" class="pseudo"><?= $scoreUserInfos["pseudo"] ?></td>
                                <td style="border-top: 3px solid #fff;" class="score"><span class="<?= $podium ?>"><?= $scoreUserInfos["bestScore"] ?></span></td>
                            </tr>
                            <?php
                        }
                    }
                    ?>
                </tbody>
            </table>
        </div>

        <footer>
            &copy; Arcade Park 2020
        </footer>
    </body>
</html>