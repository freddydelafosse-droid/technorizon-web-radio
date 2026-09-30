const {test} = require('node:test');
const assert = require('node:assert/strict');
const {verifiedFacts,loadVerifiedArtistContext} = require('../lib/jaya-music-context.cjs');
const artist = {id:1,name:'Example Artist',country:'FR',genres:['house'],active_years:'1980 - aujourd’hui',status:'active',visibility:'public'};
const row = {artist_id:1,artist_name:artist.name,matched_name:artist.name,confidence:100,proposed_country:'FR',proposed_genres:['house'],proposed_active_years:artist.active_years,
 source_details:{provider:'MusicBrainz',type:'Person',integration_status:'applied',collaboration_detected:false,integrated_fields:['country','genres','active_years']}};
test('only verified integrated facts are exposed; a person lifespan is never career years',()=>{
 assert.deepEqual(verifiedFacts(artist,row).facts,{country_code:'FR',genres:['house']});
 assert.equal(verifiedFacts(artist,{...row,source_details:{...row.source_details,integration_status:'manual_review'}}),null);
 assert.equal(verifiedFacts({...artist,visibility:'private'},row),null);
 assert.equal(verifiedFacts(artist,{...row,matched_name:'Another Artist'}),null);
 assert.equal(verifiedFacts(artist,{...row,source_details:{...row.source_details,collaboration_detected:true}}),null);
});
test('human edits that no longer match source proposals are not presented as verified',()=>{
 assert.equal(verifiedFacts({...artist,country:'GB',genres:['techno']},row),null);
});
test('lookup requires a verified song, exactly one active public artist and one provenance row',async()=>{
 const config={url:'https://example.test',key:'test-key'};
 let calls=[];
 const fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>calls.length===1?[artist]:[row]};};
 assert.equal(await loadVerifiedArtistContext({artist:artist.name},config,fetcher),null);
 assert.equal(calls.length,0);
 const result=await loadVerifiedArtistContext({brain:true,artist:artist.name},config,fetcher);
 assert.deepEqual(result.facts,{country_code:'FR',genres:['house']});
 assert.equal(calls[0].url.searchParams.get('visibility'),'eq.public');
 assert.equal(calls[0].options.signal,calls[1].options.signal);
 assert.equal(await loadVerifiedArtistContext({brain:true,artist:artist.name},config,async()=>({ok:true,json:async()=>[artist,artist]})),null);
});
test('database failure falls back without blocking generation',async()=>{
 assert.equal(await loadVerifiedArtistContext({brain:true,artist:artist.name},{url:'https://example.test',key:'test-key'},async()=>{throw new Error('timeout')}),null);
});
