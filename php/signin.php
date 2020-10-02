<?php
require("../require/bdd.php");
session_start();

if(isset($_POST["pseudo"]) && isset($_POST["password"]) && isset($_POST["repeatPassword"])) {
    if(!empty($_POST["pseudo"])) {
        if(strlen($_POST["pseudo"]) >= 3) {
            if(!strpos($_POST["pseudo"]," ") && $_POST["pseudo"][0] !== " ") {
                if(!empty($_POST["password"])) {
                    if(!empty($_POST["repeatPassword"])) {
                        if($_POST["password"] == $_POST["repeatPassword"]) {
                            $pseudo = $_POST["pseudo"];
                            $password = sha1($_POST["password"]);

                            $selectPseudo = $bdd->prepare("SELECT id FROM users WHERE pseudo = ?");
                            $selectPseudo->execute(array($pseudo));
                            if($selectPseudo->rowCount() == 0) {
                                $insertUser = $bdd->prepare("INSERT INTO users (pseudo,password,state) VALUES (?,?,?)");
                                if($insertUser->execute(array($pseudo, $password, 1))) {

                                    $selectId = $bdd->prepare("SELECT id FROM users WHERE pseudo = ? AND password = ? AND state = ?");
                                    $selectId->execute(array($pseudo, $password, 1));
                                    $selectId = $selectId->fetch();
                                    $selectId = $selectId["id"];
                                    
                                    echo "success";

                                    $_SESSION["id"] = $selectId;

                                } else {
                                    echo "Veuillez reessayer, une erreur est survenue";
                                }
                            } else {
                                echo "Un compte existe deja avec ce pseudo";
                            }
                        } else {
                            echo "Les deux mots de passe ne sont pas identiques";
                        }
                    } else {
                        echo "Veuillez retaper votre mot de passe";
                    }
                } else {
                    echo "Veuillez entrer votre mot de passe";
                }
            } else {
                echo "Veuillez ne pas mettre d'espace dans votre pseudo";
            }
        } else {
            echo "Votre pseudo doit faire au moins 3 caracteres";
        }
    } else {
        echo "Veuillez entrer votre pseudo";
    }
}