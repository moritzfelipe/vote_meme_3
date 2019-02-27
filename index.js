    //Address of the meme voting smart contract on the testnet of the aeternity blockchain
    const contractAddress = 'ct_fwL1A4AoXUJVwCch7QaCMy4ajNDghhMUB3LeTtdRTtPxhWi2H';
    //Create variable for client so it can be used in different functions
    var client = null;

    //Create a new array for the memes
    var memeArray = [];

    //Create a global variable to hold length of memes
    var memesLength = 0;

    //Function that orders memes so that the meme with the most votes is on top
    function compare(a,b) {
      if (a.votes > b.votes)
        return -1;
      if (a.votes < b.votes)
        return 1;
      return 0;
    }

    //Function to display all memes through the mustache template
    function renderMemes() {
      //Order the memes array first
      memeArray = memeArray.sort(compare);
      var template = $('#template').html();
      Mustache.parse(template);   //optional, speeds up future uses
      var rendered = Mustache.render(template, {memeArray});
      $('#memeBody').html(rendered);
    }

    //Create a function to make read calls to the aeternity blockchain
    async function callStatic(func, args, types) {
      const calledGet = await client.contractCallStatic(contractAddress,'sophia-address', func, {args}).catch(e => console.error(e));
      const decodedGet = await client.contractDecodeData(types,calledGet.result.returnValue).catch(e => console.error(e));
      return decodedGet;
    }

    //Create a function to make write calls to the aeternity blockchain
    async function contractCall(func, args, value, types) {
      const calledSet = await client.contractCall(contractAddress, 'sophia-address',contractAddress, func, {args, options: {amount:value}}).catch(async e => {
        const decodedError = await client.contractDecodeData(types, e.returnValue).catch(e => console.error(e));
      });
      return
    }

    //Execute main function
    window.addEventListener('load', async () => {
      //Display the loader animation so the user knows that something is happening.
      $("#loader").show();

      //Initialize the Aepp object through aepp-sdk.browser.js and the base app.
      client = await Ae.Aepp();

      //Make a call to get to know how many memes have been created.
      const getMemesLength = await callStatic('getMemesLength','()','int');
      memesLength = getMemesLength.value;

      //Loop over every meme to get all relevant information of the memes.
      for (let i = 1; i < memesLength; i++) {

        //Make the call to the blockchain to get all relevant information on the meme
        const meme = await callStatic('getMeme',`(${i})`,'(address, string, string, int)');

        //Push the new object into the array with all memes
        memeArray.push({
          creatorName: meme.value[2].value,
          memeUrl: meme.value[1].value,
          index: i,
          votes: meme.value[3].value,
        })
      }

      //Display the memes
      renderMemes();

      //Hide loader animation
      $("#loader").hide();
    });

    //If someone clicks to vote on a meme, get the input and execute the voteCall
    jQuery("#memeBody").on("click", ".voteBtn", async function(event){
      $("#loader").show();
      let value = $(this).siblings('input').val();
      let index = event.target.id;


      await contractCall('voteMeme',`(${index})`,value,'(string)');


      const foundIndex = memeArray.findIndex(meme => meme.index == event.target.id);
      memeArray[foundIndex].votes += parseInt(value, 10);

      renderMemes();
      $("#loader").hide();
    });

    //If someone clicks to register a meme, get the input and execute the registerCall
    $('#registerBtn').click(async function(){
      $("#loader").show();
      var name = ($('#regName').val()),
          url = ($('#regUrl').val());

      await contractCall('registerMeme',`("${url}","${name}")`,0,'(string)');

      memeArray.push({
        creatorName: name,
        memeUrl: url,
        index: memesLength,
        votes: 0,
      })

      renderMemes();
      $("#loader").hide();
    });
