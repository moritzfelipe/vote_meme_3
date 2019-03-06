    //Address of the meme voting smart contract on the testnet of the aeternity blockchain
    const contractAddress = 'ct_fwL1A4AoXUJVwCch7QaCMy4ajNDghhMUB3LeTtdRTtPxhWi2H';
    //Create variable for client so it can be used in different functions
    var client = null;
    //Create a new array for the memes
    var memeArray = [];
    //Create a new variable to store the length of the meme globally
    var memesLength = 0;

    function renderMemes() {
      //Order the memes array so that the meme with the most objects is on top
      memeArray = memeArray.sort(function(a,b){return b.votes-a.votes})
      var template = $('#template').html();
      Mustache.parse(template);   //optional, speeds up future uses
      var rendered = Mustache.render(template, {memeArray});
      $('#memeBody').html(rendered);
    }

    async function callStatic(func, args, types) {
      const calledGet = await client.contractCallStatic(contractAddress,'sophia-address', func, {args}).catch(e => console.error(e));
      const decodedGet = await client.contractDecodeData(types,calledGet.result.returnValue).catch(e => console.error(e));
      return decodedGet;
    }

    async function contractCall(func, args, value, types) {
      const calledSet = await client.contractCall(contractAddress, 'sophia-address',contractAddress, func, {args, options: {amount:value}}).catch(async e => {
        const decodedError = await client.contractDecodeData(types, e.returnValue).catch(e => console.error(e));
      });
      return
    }

    //Execute main function
    window.addEventListener('load', async () => {
      //Display the loader animation so the user knows that something is happening
      $("#loader").show();

      //Initialize the Aepp object through aepp-sdk.browser.js, the base app needs to be running.
      client = await Ae.Aepp();

      //First make a call to get to know how may memes have been created and need to be displayed
      const getMemesLength = await callStatic('getMemesLength','()','int');
      memesLength = getMemesLength.value;

      //Loop over every meme to get all their relevant information
      for (let i = 1; i < memesLength; i++) {

        //Make the call to the blockchain to get all relevant information on the meme
        const meme = await callStatic('getMeme',`(${i})`,'(address, string, string, int)');

        //Create meme object with  info from the call and push into the array with all memes
        memeArray.push({
          creatorName: meme.value[2].value,
          memeUrl: meme.value[1].value,
          index: i,
          votes: meme.value[3].value,
        })
      }

      //Display updated memes
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

      //Hide the loading animation after async calls return a value
      const foundIndex = memeArray.findIndex(meme => meme.index == event.target.id);
      //console.log(foundIndex);
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
        index: memesLength+1,
        votes: 0,
      })

      renderMemes();
      $("#loader").hide();
    });
