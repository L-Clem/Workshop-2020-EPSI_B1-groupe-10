<?php
session_start();

if(!isset($_SESSION["id"]) || empty($_SESSION["id"]) || !is_numeric($_SESSION["id"])) {
    header("Location: ../");
}
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Arcade Park</title>
        <meta name="description" content="...">
        <link rel="stylesheet" href="../assets/css/panel.css" type="text/css">
        <script type="text/javascript" src="../assets/js/script.js"></script>
        <meta name="keywords" content="...">
        <meta http-equiv="Content-Language" content="fr">          
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/png" sizes="228x228" href="../assets/img/logo_violet.png">
    </head>

    <body>
        <div class="navbar">
            <a href="../"><img src="../assets/img/logo_violet.png" class="logo"></a>
            <div class="title">
                Communauté
            </div>
        </div>
        <div class="container">
            <h2>Ajoutez votre propre jeu</h2>
            <form id="form">
                <div class="box">
					<input type="file" name="file-1[]" id="file-1" class="inputfile inputfile-1">
					<label for="file-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17"><path d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z"></path></svg> <span>Sélectionnez votre fichier</span></label>
				</div>

                <input type="submit" value="Envoyer" />
            </form>

            <div class="steps">
                <div class="step1"><img src="../assets/img/wait.png" width="30px">Envoi de votre fichier zip...</div>
                <div class="step2"><img src="../assets/img/wait.png" width="30px">Vérification des fichiers...</div>
                <div class="step3"><img src="../assets/img/wait.png" width="30px">Modification des fichiers...</div>
                <div class="step4"><img src="../assets/img/wait.png" width="30px">Installation des fichiers sur notre serveur...</div>
                <div class="step5"><img src="../assets/img/wait.png" width="30px">Votre jeu est maintenant disponible sur Arcade Park !</div>
            </div>
        </div>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script>
            var inputs = document.querySelectorAll( '.inputfile' );
            Array.prototype.forEach.call( inputs, function( input )
            {
                var label	 = input.nextElementSibling,
                    labelVal = label.innerHTML;

                input.addEventListener( 'change', function( e )
                {
                    var fileName = '';
                    if( this.files && this.files.length > 1 )
                        fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
                    else
                        fileName = e.target.value.split( '\\' ).pop();

                    if( fileName )
                        label.querySelector( 'span' ).innerHTML = fileName;
                    else
                        label.innerHTML = labelVal;
                });
            });

            $('input[type=submit]').on('click', function() {
                $(".step1 img").attr("src", "../assets/img/loading_panel.gif");
                setTimeout(function() {
                    $(".step1 img").attr("src", "../assets/img/check.png");
                    $(".step2 img").attr("src", "../assets/img/loading_panel.gif");
                    setTimeout(function() {
                        $(".step2 img").attr("src", "../assets/img/check.png");
                        $(".step3 img").attr("src", "../assets/img/loading_panel.gif");
                        setTimeout(function() {
                            $(".step3 img").attr("src", "../assets/img/check.png");
                            $(".step4 img").attr("src", "../assets/img/loading_panel.gif");
                            setTimeout(function() {
                                $(".step4 img").attr("src", "../assets/img/check.png");
                                $(".step5 img").attr("src", "../assets/img/check.png");
                            },1000);
                        },3000);
                    },1000);
                },1500);

                return false;
            });
        </script>
    </body>
</html>