var newZBBS = function(zbbsOptions) {
if (zbbsOptions.isOn==true && zbbsOptions.imageLink) {

$("#stats_header + .forums .c_foot").parent().before( "<tr><th colspan='2' class='appendTo'>"+zbbsOptions.Title+"</th></tr><tr><td class='c_mark'><a href='"+zbbsOptions.imageLink+"'><img alt='' src='"+zbbsOptions.Image+"'/></a></td><td>"+zbbsOptions.Info+"</td></tr>");};

if (zbbsOptions.isOn==true && !zbbsOptions.imageLink) {

$("#stats_header + .forums .c_foot").parent().before( "<tr><th colspan='2' class='appendTo'>"+zbbsOptions.Title+"</th></tr><tr><td class='c_mark'><img alt='' src='"+zbbsOptions.Image+"'/></td><td>"+zbbsOptions.Info+"</td></tr>");};
};