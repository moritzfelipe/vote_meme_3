    //Address of the meme voting smart contract on the testnet of the aeternity blockchain
    const contractAddress = 'ct_fwL1A4AoXUJVwCch7QaCMy4ajNDghhMUB3LeTtdRTtPxhWi2H';
    //Create variable for client so it can be used in different functions
    var client = null;

    //Function to build together the html list of all memes
    function displayMemeList(memeArray) {
      memeArray.map((item, index) => {
        if(item.memeUrl){
          $("#memeBody").append("<div id='index-"+index+"' class='card'></div>");
          $("#index-"+index+"").append("<h5 class='card-title'>"+item.creatorName+"</h5>");
          $("#index-"+index+"").append("<img class='card-img-top' src="+item.memeUrl+" alt='Card image cap'>");
          $("#index-"+index+"").append("<div class='card-body' index="+item.index+" id='card-body-id-"+index+"'></div>");
          $("#card-body-id-"+index+"").append("<h2 class='card-title'>"+(index+1)+".</div>");
          $("#card-body-id-"+index+"").append("<h6 class='card-subtitle mb-2 text-muted'>"+item.votes+" ættos</h6>");
          $("#card-body-id-"+index+"").append("<form class='inputForm' id='form-vote-"+index+"'></form>");
          $("#form-vote-"+index+"").append("<input type='number' name='input1' class='form-control inputVote1' id='inputVote"+index+"' placeholder='Amount'>");
          $("#card-body-id-"+index+"").append("<button class='btn voteBtn btn-block'>VOTE <img style='width:25px; margin-top:-0.25em;' src='https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/155/ballot-box-with-ballot_1f5f3.png'></button>");
        }
      });
    }

    //Function that orders memes so that the meme with the most votes is on top
    function orderMemes(memeArrayUnordered) {
      function compare(a,b) {
        if (a.votes > b.votes)
          return -1;
        if (a.votes < b.votes)
          return 1;
        return 0;
      }
      let memeArrayOrdered = memeArrayUnordered.sort(compare);
      return memeArrayOrdered
    }

    //Function to execute the vote call when a user votes with ae on a meme
    async function voteCall(index,inputAmount) {
      //Display the loader animation so the user knows that something is happening
      $("#loader").show();
      //Make the async call to the blockchain with index of the meme and amount in attos
      const calledSet = await client.contractCall(contractAddress, 'sophia-address', contractAddress, 'voteMeme', {args: '('+index+')',options: {amount: inputAmount}}).catch(async e => {
      console.error(e);
      //If there is an error decode and console log it
      const decodedError = await client.contractDecodeData('string', e.returnValue).catch(e => console.error(e));
      console.log('decodedError', decodedError);
      });
      //Hide the loading animation after async calls return a value
      $("#loader").hide();
      //Reload the page so the new voting value can be shown
      location.reload();
    };

    //Function to register a meme after user submitted form, similar to vote function
    async function registerCall(url,name) {
      $("#loader").show();
      const calledSet = await client.contractCall(contractAddress, 'sophia-address', contractAddress, 'registerMeme', {args: '("'+url+'","'+name+'")'}).catch(async e => {
        console.error(e);
        const decodedError = await client.contractDecodeData('string', e.returnValue).catch(e => console.error(e));
        console.log('decodedError', decodedError);
      });
      $("#loader").hide();
      location.reload();
    };

    //Execute main function
    window.addEventListener('load', async () => {
      //Initialize the Aepp object through aepp-sdk.browser.js and the base app on that this aepp needs to be running.
      client = await Ae.Aepp();

      $("#loader").show();
      //First make a call to get to know how may memes have been created and need to be displayed
      const calledGet = await client.contractCallStatic(contractAddress, 'sophia-address', 'getMemesLength ', {args: '()'}).catch(e => console.error(e));
      console.log('calledGet', calledGet);

      const decodedGet = await client.contractDecodeData('int', calledGet.result).catch(e => console.error(e));
      console.log('decodedGet1', decodedGet.value);

      //Pass the int value of meme length to a const
      const length = decodedGet.value;

      //Create a new array for the memes
      var memeArray = [];

      //Loop over every meme to get all its relevant information
      for (let i = 1; i < length+1; i++) {
        //Make the call to the blockchain to get all relevant information on the meme
        const calledGet = await client.contractCallStatic(contractAddress, 'sophia-address', 'getMeme ', {args: '('+i+')'}).catch(e => console.error(e));

        const decodedGet = await client.contractDecodeData('(address, string, string, int)', calledGet.result).catch(e => console.error(e));

        //Create a new element with all the relevant information for the meme
        var element = {};
        element.creatorName = decodedGet.value[2].value;
        element.memeUrl = decodedGet.value[1].value;
        element.index = i;
        element.votes = decodedGet.value[3].value;

        //Push the new element into the array with all memes
        memeArray.push(element);
      }

      $("#loader").hide();

      //Order the memes array so that the meme with the most objects is on top
      memeArray = orderMemes(memeArray);
      //Display all memes in an html list
      displayMemeList(memeArray);
    }

    //If someone clicks to vote on a meme, get the input and execute the voteCall
    jQuery("#memeBody").on("click", ".voteBtn", function(){
      var input = $(this).closest('div'),
          index = input.attr('index'),
          inputValue = input.find('input[name="input1"]').val();

      voteCall(index,inputValue);
    });

    //If someone clicks to register a meme, get the input and execute the registerCall
    $('#registerBtn').click(function() {
      var name = ($('#regName').val()),
          url = ($('#regUrl').val());

      registerCall(url,name);
    });
