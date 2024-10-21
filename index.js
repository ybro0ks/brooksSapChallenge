import { myTree } from './datastructure.js'; // my tree from the last place. my datastructure to store information
import express from 'express'; //import express
import csv from 'csv-parser'; //import csv parser
import fs from 'fs';     

const invalidRows = []; // Initialize invalid rows array, tells us whats not good.
const map = new Map(); // To track presence of IDs and validate it.




function readCSV() { // my function to read csv
    /*
    this creates a read stream, reads the file in little by little.
    parses it by the titles i have in the string array.
    this is one of the key 'openings' where data can be added. so it must be validated here.
    if data is validated here, inside the datastructure it will always make sense
    */
    fs.createReadStream('data.csv')
        .pipe(csv(['ID', 'Name', 'Email', 'Position', 'Salary']))
        .on('data', (data) => {

            // parse out id, name, email, position, salary 

            const id = parseInt(data.ID, 10); 
            const Name  = data.Name;
            const email = data.Email;
            const position = data.Position;
            const salary = data.Salary

        // validate id, make sure the id exists and make sure id isnt a duplicate using a map
            if (isNaN(id)) {
                invalidRows.push(data);
                console.log(`Invalid row (NaN ID): ${JSON.stringify(data)}`);
                return;
            }
            // Check for duplicate IDs
            if (!map.has(id)) {
                map.set(id, true);
                myTree.insert(id, data.Name, data.Email, data.Position, Number(data.Salary));
            } else {
                invalidRows.push(data);
                console.log(`Duplicate ID, not inserted: ${JSON.stringify(data)}`);
            }
            if (!id || !Name || !email || !position || !salary) {
                invalidRows.push(data); // add data to invalid rows
            }

            if (!validateEmail(email)) {
                invalidRows.push(data); //add data to invalid rows.
            }
        })
        .on('end', () => {
            console.log("processing completed");
            console.log(invalidRows);
            console.log(map.size);
        });
}
readCSV();

// email validator
function validateEmail(email) {
    return emailRegex.test(email);
}
// regex that validates the email.
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// initializing express, and letting it run on 3000

const app = express();
const PORT = process.env.PORT || 3000;

// API endpoint to retrieve an employee by ID (tested)
app.get('/employees/:id', (req, res) => {
    const searchId = parseInt(req.params.id); // Parse ID from the request parameters
    console.log(searchId);
    const result = myTree.search(searchId); // Use the search method in my function to find the record
    console.log(result);

    if (result) {
        res.json(result); // Return the record as JSON if found
    } else {
        res.status(404).json({ message: "Employee not found." }); // Return a 404 status if not found
    }
});

app.use(express.json());

//get all employees.(tested)
app.get('/employees', (req, res) => {
    console.log("Running");
    const result = myTree.getAllRecords();
    
    if (result.length > 0) { // Check if the result array is not empty
        res.status(200).json(result); // 200 ok and show the information
    } else {
        res.status(404).json({ message: "Our datastructure is empty" }); // if its empty, theres nothing in the array
    }
});

//Update method, (tested.)
app.put('/employees/:id', async (req, res) => { 
    try {
        console.log('running');
        const id = parseInt(req.params.id); 

        // Get the fields we want to updae from the request body
        const { Name, Email, Position, Salary } = req.body;  

        // Validate the ID to ensure we have a place to update
        if (isNaN(id)) {
            return res.status(400).send('Invalid ID');
        }

        // doesnt make sense to update nothing.
        if (!Name && !Email && !Position && !Salary) {
            return res.status(400).send('At least one field must be provided for update');
        }

        // Validate email format if it's being updated
        if (Email) {
            if (!emailRegex.test(Email)) {
                return res.status(400).send('Invalid email format');
            }
        }

        // Validate that Salary is a positive number
        if (Salary < 0) {
            return res.status(400).send('Salary must be a positive number');
        }

        // Create an object with the fields to update
        const updatedFields = {};
        if (Name) updatedFields.Name = Name;
        if (Email) updatedFields.Email = Email;
        if (Position) updatedFields.Position = Position;
        if (Salary !== undefined) updatedFields.Salary = Salary;

        // Call the update method from my tree data structure
        const result = myTree.update(id, updatedFields);

        if (result) {
            return res.status(200).send('Record updated successfully');
        } else {
            return res.status(404).send('Employee not found');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error while updating record');
    }
});

app.use((req, res, next) => { //for debuging purposes.
    console.log(`${req.method} ${req.url}`);
    next();
});

app.delete('/employee/:id', (req, res) => {
    try {
        console.log('Attempting to delete employee'); // debugging purposes
        const searchId = parseInt(req.params.id, 10); // Parse ID from URL
        
        const result = myTree.delete(searchId); // Attempt to delete employee 
        console.log(result); // debugging purposes

        if (result) {
            // If deletion is successful, return a success message
            res.json({ message: `employee deleted.` });
        } else {
            // If employee not found, return 404 status and message
            res.status(404);
        }

    } catch (error) {
        
        console.error(error);
        res.status(500).json({ message: "An error occurred." });
    }
});

//Create function to create new user. 
app.post('/newEmployee', async (req, res) => {
    try {
        console.log('Running'); //debugging purposes
        const { ID, Name, Email, Position, Salary } = req.body;  //expecting a json format

        // Validation
        if (!ID || !Name || !Email || !Position || !Salary) {
           return res.status(400).send('All fields are required');
       }

        
        if (!validateEmail(Email)) {
            return res.status(400).send('Invalid email format');
        }

       
        if (Salary < 0) {
            return res.status(400).send('Salary must be a positive number');
        }

        // Insert the new employee into the tree data structure
        myTree.insert(ID, Name, Email, Position, Salary);

        return res.status(201).send('Record inserted successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Failed to insert record');
    }
});




// Start the server
app.listen(PORT, () => {
    console.log(`Now Listening on Port: ${PORT}`);
});