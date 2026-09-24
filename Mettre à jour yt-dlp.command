#!/bin/bash
echo "Mise à jour de yt-dlp..."
brew upgrade yt-dlp
echo
echo "Version installée : $(yt-dlp --version)"
echo
read -n 1 -s -r -p "Appuie sur une touche pour fermer..."
echo
