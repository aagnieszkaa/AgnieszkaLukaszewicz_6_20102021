const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.saveSauce = (req, res, next) => {
  //conversion de la chaîne en objet JSON
  const sauceObject = JSON.parse(req.body.sauce);
  //supprimer le faux_id envoyé par le front-end
  delete sauceObject._id;
  //créer une instance du modèle sauce
  const sauce = new Sauce({
    ...sauceObject,
    //URL complète de notre image
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  //enregistrer la sauce dans la base de données
  sauce.save() 
    //réponse de réussite avec un code 201 (création de la ressource)
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
    //réponse avec l'erreur générée par Mongoose ainsi qu'un code d'erreur 400 (bad request)
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  //trouver la sauce unique ayant le même _id que le paramètre de la requête
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauce = (req, res, next) => {
  //si le fichier est renseigne, le premier block, s'il n'est pas la, deuxieme block
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      //ajout d'une image
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
    } : { ...req.body };
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      //supprimer l'image lors de la modification
      fs.unlink(`images/${filename}`, () => {
        //mettre à jour la sauce (remplacer le premier argument par le deuxième)
        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
          .catch(error => res.status(400).json({ error }));
      });
  })
  .catch(error => res.status(500).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getListOfSauces = (req, res, next) => {
  //renvoyer un tableau contenant toutes les sauces dans la base de données
  Sauce.find().then(
    (sauces) => {
      //code 200 (success)
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      //erreur 404 (not found)
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.likeOrDislikeSauce = (req, res, next) => {
  Sauce.findById(req.params.id)
    .then((sauce) => {
      switch (req.body.like) {
          //dislike
          case -1:
            sauce.usersDisliked.push(req.body.userId);
            sauce.dislikes++;
      break;
          //like
          case 1:
            sauce.usersLiked.push(req.body.userId);
            sauce.likes++;
            break;
          //annuler like ou dislike
          case 0:
            if (sauce["usersLiked"].includes(req.body.userId)) {
                  sauce["usersLiked"].splice(sauce["usersLiked"].indexOf(req.body.userId), 1);
            } else if (sauce["usersDisliked"].includes(req.body.userId)) {
                    sauce["usersDisliked"].splice(sauce["usersDisliked"].indexOf(req.body.userId), 1);
              }
            break;
      }
    //mise à jour des likes et des dislikes
    sauce["dislikes"] = sauce["usersDisliked"].length;
    sauce["likes"] = sauce["usersLiked"].length;   
   
    Sauce.updateOne({_id: req.params.id}, sauce)
      .then(() => {
        res.status(200).json({message: "Sauce modifiée !"});
      })
      .catch((err) => {
        res.status(400).json({ error });
      });
    })
    .catch((error) => res.status(500).json({ error }));
};