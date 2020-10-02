<?php

  $maintenance = false;

  if($maintenance) {
    header("Location: error.php?error=5");
  }

  $host_name = '127.0.0.1';
  $database = 'arcadepark';
  $user_name = 'root';
  $password = '';
  $bdd = null;

  try {
    $bdd = new PDO("mysql:host=$host_name; dbname=$database;charset=utf8mb4", $user_name, $password);
  } catch (PDOException $e) {
    echo "Erreur!: " . $e->getMessage() . "<br/>";

    die();
  }

?>