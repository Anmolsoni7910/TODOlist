const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Local connection on port 27017
//mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
mongoose.connect('mongodb+srv://AnmolSoni:Anmol123@clusterdemo.fy865bw.mongodb.net/todolistDB?retryWrites=true&w=majority');

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add the new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete the item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name : String,
    items : [itemSchema]
});

const List = mongoose.model("List",listSchema);

app.get("/", (req, res) => {
    Item.find()
        .then((foundItem) => {
            if (foundItem.length === 0) {
                Item.insertMany(defaultItems)
                    .then(console.log("Successfully saved item into DB"))
                    .catch((err) => {
                        console.log(err);
                    });
                res.redirect("/");
            } else {
                res.render("list", {
                    listTitle: "Today",
                    newListItems: foundItem
                })
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name : itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name : listName})
        .then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
        .catch((err) => {
            console.log(err);
        });
    }
});

app.get("/:customListName",(req,res) => {

    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name : customListName})
    .then((foundList) => {
        if(foundList === null){
            const list = new List({
                name : customListName,
                items : defaultItems 
            });
            list.save();
            res.redirect("/" + customListName);
        }else{
            res.render("list",{
                listTitle : foundList.name,
                newListItems : foundList.items 
            })
        }
    })
    .catch((err) => {
        console.log(err);
    });
});

app.post("/delete",(req,res) => {
    const itemDel = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.deleteOne({_id : itemDel})
        .then(() => {
            console.log("Item deleted!!!");
            res.redirect("/");
        })
        .catch((err) => {
            console.log(err);
        });
    }else{
        List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : itemDel}}})
        .then(() => {
            res.redirect("/" + listName);
        })
        .catch((err) => {
            console.log(err);
        });
    }
});

app.get("/about", (req, res) => {
    res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, () => {
    console.log("Server is running successfully");
});