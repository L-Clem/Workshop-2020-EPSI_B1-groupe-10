<?php
session_start();
require("../require/bdd.php");

if($_FILES["file"]["name"]) {
	$filename = $_FILES["file"]["name"];
	$source = $_FILES["file"]["tmp_name"];
	$type = $_FILES["file"]["type"];
	
	$name = explode(".", $filename);

    $continue = strtolower($name[1]) == 'zip' ? true : false;
    if(!$continue) {
        $message = "Upload un zip";
    } else {
        $target_path = "../upload/".$filename;
        if(move_uploaded_file($source, $target_path)) {
            $zip = new ZipArchive();
            $x = $zip->open($target_path);
            if ($x === true) {
                $zip->extractTo("../games/jeu"); // change this to the correct site path
                $zip->close();
        
                unlink($target_path);

                $message = "okay";
            }
            $message = "Your .zip file was uploaded and unpacked.";
        } else {	
            $message = "There was a problem with the upload. Please try again.".$source;
        }
    }
}

echo $message;
?>