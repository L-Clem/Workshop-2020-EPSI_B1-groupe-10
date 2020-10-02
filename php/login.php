<?php
require("../require/bdd.php");
session_start();

if(isset($_POST["pseudo"]) && isset($_POST["password"])) {
    if(!empty($_POST["pseudo"])) {
        if(!empty($_POST["password"])) {
            $pseudo = $_POST["pseudo"];
            $password = sha1($_POST["password"]);

            $selectUser = $bdd->prepare("SELECT id FROM users WHERE pseudo = ? AND password = ? AND state = ?");
            $selectUser->execute(array($pseudo, $password, 1));
            
            if($selectUser->rowCount() == 1) {

                $selectUser = $selectUser->fetch();
                
                echo "success";

                $_SESSION["id"] = $selectUser["id"];
            } else {
                echo "Le pseudo et le mot de passe ne correspondent pas";
            }
        } else {
            echo "Veuillez entrer votre mot de passe";
        }
    } else {
        echo "Veuillez entrer votre pseudo";
    }
}