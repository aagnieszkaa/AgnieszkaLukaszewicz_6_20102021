const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.saveSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
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
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //ajout d'une image
    } : { ...req.body };
  //supprimer l'image lors de la modification et la mise à jour de la sauce
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
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
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
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
          //cancel like or dislike
          case 0:
            if (sauce["usersLiked"].includes(req.body.userId)) {
                  sauce["usersLiked"].splice(sauce["usersLiked"].indexOf(req.body.userId), 1);
            } else if (sauce["usersDisliked"].includes(req.body.userId)) {
                    sauce["usersDisliked"].splice(sauce["usersDisliked"].indexOf(req.body.userId), 1);
              }
            break;
      }
    //update number of likes and dislikes
    sauce["dislikes"] = sauce["usersDisliked"].length;
    sauce["likes"] = sauce["usersLiked"].length;   
   
    Sauce.updateOne({_id: req.params.id}, sauce)
      .then(() => {
        res.status(200).json({message: "Sauce modifiée !"});
      })
      .catch((err) => {
        res.status(500).json({ error });
      });
    })
    .catch((error) => res.status(404).json({ error }));
};