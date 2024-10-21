# brooksSapChallenge
My submission for the sap ux challenge


My code works as normal, my datastructure first has to be ran with node and then the index.js file will then be run and it has to be in that order because the index.js file is dependent on the datastructure and not running will lead to errors.

When programming this, i tried to optimize for performance, i tried to think further ahead as to what if my project was being used by multiple business users to store hundreds of millions of records (i know in real business sense there would be a database for this but just assuming.) in that case i decided to utilize data structures that no matter how much data was added, the time complexity of queries would still be the same. 

For example, assuming that my data was unsorted when inserted into a different data structure for example an array, i wouldnt be able to index it to find employee at specific id, or if i wanted to find employees within a range of id, lets say 10000 - 30000, if its unsorted this would take o(n) in a brute force linear search method, or if sorting happens first everytime a new array is inserted (very very resource intensive when it begins to grow the time complexity would be even worse.

With my data structure however, my b+ tree sorts the data into its ranges effectively and is ideal for searches within range aswell.

I tested the api endpoints with postman, i provided all the endpoints required and the basic create, retrieve, update and deletion endpoint.

data.csv is the file i used for testing it works as normal, it contains 60 rows, one row has been edited to not match email format, the validation catches that row out. large_employee_Data.csv is data created by the faker library in python (ran on jupiter notebooks) contains two hundred thousand or so rows of data. i used that to ensure my theory that the data structure would still be high performance regardless of how large the data set becomes.


Thanks for reading.

